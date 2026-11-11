import crypto, { randomInt, randomUUID } from "crypto";
import { connectDB, getSequelize } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order, OrderItem, OrderStatusHistory } from "@/models/Order";
import { MAX_QTY_PER_LINE } from "@/models/Cart";
import { unitPricePaise } from "@/lib/pricing";
import { getActivePublishedOffers, evaluateOffers } from "@/lib/services/offers";
import type { BuyNowCreateOrderInput, BuyNowVerifyInput } from "@/lib/validations/buy-now";

const SHIPPING_FEE_PAISE = 0;

export function getRazorpayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const configured = Boolean(keyId && keySecret);
  const isTestMode = !configured || keyId.startsWith("rzp_test_");
  return { configured, keyId, keySecret, isTestMode };
}

function getDemoHmacSecret(): string {
  return (
    process.env.RAZORPAY_KEY_SECRET?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    process.env.DB_PASSWORD?.trim() ||
    "mirqas-buy-now-demo-secret-key"
  );
}

export function signDemoToken(orderId: string, razorpayOrderId: string): string {
  return crypto
    .createHmac("sha256", getDemoHmacSecret())
    .update(`${orderId}|${razorpayOrderId}`)
    .digest("hex");
}

export function verifyDemoToken(orderId: string, razorpayOrderId: string, token: string): boolean {
  if (!token) return false;
  const expected = signDemoToken(orderId, razorpayOrderId);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(token, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  keySecret: string
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(razorpaySignature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function newOrderNumber() {
  const d = new Date();
  const ymd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 6; i++) tail += chars[randomInt(chars.length)];
  return `MQ-${ymd}-${tail}`;
}

export type BuyNowQuote = {
  product: {
    id: string;
    slug: string;
    name: string;
    image: string;
    category: string;
    ml: number;
    qty: number;
    stock: number;
  };
  unitPricePaise: number;
  subtotalPaise: number;
  discountTotalPaise: number;
  offerId: string | null;
  offerTitle: string | null;
  shippingFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  gatewayMode: "razorpay" | "demo";
  isTestMode: boolean;
};

export async function calculateBuyNowQuote(input: {
  slug: string;
  ml: number;
  qty: number;
}): Promise<{ ok: true; quote: BuyNowQuote } | { ok: false; status: number; message: string }> {
  await connectDB();

  if (input.qty < 1 || input.qty > MAX_QTY_PER_LINE) {
    return { ok: false, status: 400, message: `Quantity must be between 1 and ${MAX_QTY_PER_LINE}.` };
  }

  const product = await Product.findOne({
    where: { slug: input.slug, isActive: true },
  });

  if (!product) {
    return { ok: false, status: 404, message: "This perfume is no longer available." };
  }

  if (product.stock < input.qty) {
    return {
      ok: false,
      status: 409,
      message: product.stock < 1 ? `${product.name} is currently out of stock.` : `Only ${product.stock} left in stock for ${product.name}.`,
    };
  }

  const unit = unitPricePaise(product, input.ml);
  if (unit === null) {
    return { ok: false, status: 400, message: "Invalid bottle size selected." };
  }

  const subtotalPaise = unit * input.qty;

  // Evaluate active published offers strictly for this single Buy Now line
  const activeOffers = await getActivePublishedOffers();
  const offerEval = evaluateOffers(
    [
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        ml: input.ml,
        qty: input.qty,
        unitPrice: unit,
      },
    ],
    activeOffers
  );

  const discountTotalPaise = offerEval ? offerEval.discountTotal : 0;
  const totalPaise = Math.max(0, subtotalPaise - discountTotalPaise) + SHIPPING_FEE_PAISE;
  const images = Array.isArray(product.images) ? product.images : [];
  const cfg = getRazorpayConfig();

  return {
    ok: true,
    quote: {
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: images[0] ?? "",
        category: product.category,
        ml: input.ml,
        qty: input.qty,
        stock: product.stock,
      },
      unitPricePaise: unit,
      subtotalPaise,
      discountTotalPaise,
      offerId: offerEval?.offerId || null,
      offerTitle: offerEval?.offerTitle || null,
      shippingFeePaise: SHIPPING_FEE_PAISE,
      taxPaise: 0, // Inclusive of all taxes
      totalPaise,
      gatewayMode: cfg.configured ? "razorpay" : "demo",
      isTestMode: cfg.isTestMode,
    },
  };
}

async function createRazorpayOrderApi(params: {
  amountPaise: number;
  receipt: string;
  keyId: string;
  keySecret: string;
  notes: Record<string, string>;
}): Promise<{ ok: true; razorpayOrderId: string } | { ok: false; message: string }> {
  const auth = Buffer.from(`${params.keyId}:${params.keySecret}`).toString("base64");
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: "INR",
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      const desc = data?.error?.description || "Unable to initialize Razorpay payment order.";
      return { ok: false, message: desc };
    }
    return { ok: true, razorpayOrderId: String(data.id) };
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return { ok: false, message: "Could not reach Razorpay payment gateway. Please try again." };
  }
}

export async function createBuyNowOrder(
  userId: string,
  input: BuyNowCreateOrderInput
): Promise<
  | {
      ok: true;
      mode: "razorpay" | "demo";
      isTestMode: boolean;
      keyId?: string;
      razorpayOrderId: string;
      demoToken?: string;
      amountPaise: number;
      currency: "INR";
      orderNumber: string;
      orderId: string;
    }
  | { ok: false; status: number; message: string; alreadyPaid?: boolean; orderNumber?: string }
> {
  await connectDB();
  const sequelize = getSequelize();
  const cfg = getRazorpayConfig();

  // Check if an order with this idempotencyKey already exists
  const existingOrder = await Order.findOne({
    where: { userId, idempotencyKey: input.idempotencyKey },
    include: [{ model: OrderItem, as: "items" }],
  });

  if (existingOrder) {
    if (existingOrder.paymentStatus === "paid") {
      return {
        ok: false,
        status: 409,
        message: "Payment has already been completed for this order.",
        alreadyPaid: true,
        orderNumber: existingOrder.orderNumber,
      };
    }

    // If customer is retrying after a cancellation/failure on the same checkout session:
    // Re-verify quote matches or refresh Razorpay order on the existing DB record (prevents duplicate rows!)
    const quoteRes = await calculateBuyNowQuote(input.item);
    if (!quoteRes.ok) return quoteRes;
    const { quote } = quoteRes;

    // Update shipping details and latest server totals in case user edited form before retry
    let rzpOrderId = existingOrder.razorpayOrderId;
    const needsNewGatewayOrder =
      !rzpOrderId ||
      existingOrder.paymentStatus === "failed" ||
      existingOrder.total !== quote.totalPaise ||
      (cfg.configured && rzpOrderId.startsWith("order_demo_")) ||
      (!cfg.configured && !rzpOrderId.startsWith("order_demo_"));

    if (needsNewGatewayOrder) {
      if (cfg.configured) {
        const rzp = await createRazorpayOrderApi({
          amountPaise: quote.totalPaise,
          receipt: existingOrder.orderNumber,
          keyId: cfg.keyId,
          keySecret: cfg.keySecret,
          notes: {
            orderId: existingOrder.id,
            flow: "buy_now_direct",
            mode: cfg.isTestMode ? "test" : "live",
          },
        });
        if (!rzp.ok) return { ok: false, status: 502, message: rzp.message };
        rzpOrderId = rzp.razorpayOrderId;
      } else {
        rzpOrderId = `order_demo_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
      }
    }

    const demoNotePrefix = cfg.configured
      ? cfg.isTestMode
        ? "[Razorpay Test Mode - Direct Buy Now]"
        : "[Direct Buy Now]"
      : "[DEMO MODE SIMULATION - Razorpay keys not configured; test mode only]";

    const fullNote = [demoNotePrefix, input.note.trim()].filter(Boolean).join(" | ");

    await existingOrder.update({
      subtotal: quote.subtotalPaise,
      discountTotal: quote.discountTotalPaise,
      offerId: quote.offerId,
      offerTitle: quote.offerTitle,
      total: quote.totalPaise,
      status: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      razorpayOrderId: rzpOrderId,
      shippingName: input.shipping.name,
      shippingPhone: input.shipping.phone,
      shippingLine1: input.shipping.line1,
      shippingLine2: input.shipping.line2 || "",
      shippingCity: input.shipping.city,
      shippingState: input.shipping.state,
      shippingPincode: input.shipping.pincode,
      note: fullNote,
    });

    if (cfg.configured) {
      return {
        ok: true,
        mode: "razorpay",
        isTestMode: cfg.isTestMode,
        keyId: cfg.keyId,
        razorpayOrderId: rzpOrderId,
        amountPaise: quote.totalPaise,
        currency: "INR",
        orderNumber: existingOrder.orderNumber,
        orderId: existingOrder.id,
      };
    }

    return {
      ok: true,
      mode: "demo",
      isTestMode: true,
      razorpayOrderId: rzpOrderId,
      demoToken: signDemoToken(existingOrder.id, rzpOrderId),
      amountPaise: quote.totalPaise,
      currency: "INR",
      orderNumber: existingOrder.orderNumber,
      orderId: existingOrder.id,
    };
  }

  // Fresh order creation
  const quoteRes = await calculateBuyNowQuote(input.item);
  if (!quoteRes.ok) return quoteRes;
  const { quote } = quoteRes;

  const orderId = randomUUID();
  const orderNumber = newOrderNumber();

  let razorpayOrderId = "";
  if (cfg.configured) {
    const rzp = await createRazorpayOrderApi({
      amountPaise: quote.totalPaise,
      receipt: orderNumber,
      keyId: cfg.keyId,
      keySecret: cfg.keySecret,
      notes: {
        orderId,
        flow: "buy_now_direct",
        productSlug: quote.product.slug,
        ml: String(quote.product.ml),
        qty: String(quote.product.qty),
        mode: cfg.isTestMode ? "test" : "live",
      },
    });
    if (!rzp.ok) return { ok: false, status: 502, message: rzp.message };
    razorpayOrderId = rzp.razorpayOrderId;
  } else {
    razorpayOrderId = `order_demo_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
  }

  const demoNotePrefix = cfg.configured
    ? cfg.isTestMode
      ? "[Razorpay Test Mode - Direct Buy Now]"
      : "[Direct Buy Now]"
    : "[DEMO MODE SIMULATION - Razorpay keys not configured; test mode only]";
  const fullNote = [demoNotePrefix, input.note.trim()].filter(Boolean).join(" | ");

  try {
    await sequelize.transaction(async (t) => {
      // Re-check product inside transaction with row lock (stock deducted only upon payment verification)
      const p = await Product.findOne({
        where: { id: quote.product.id, isActive: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!p || p.stock < quote.product.qty) {
        throw new Error(
          !p
            ? "Perfume is no longer available."
            : p.stock < 1
            ? `${p.name} is sold out.`
            : `Only ${p.stock} left of ${p.name}.`
        );
      }

      await Order.create(
        {
          id: orderId,
          orderNumber,
          userId,
          subtotal: quote.subtotalPaise,
          discountTotal: quote.discountTotalPaise,
          offerId: quote.offerId,
          offerTitle: quote.offerTitle,
          shippingFee: quote.shippingFeePaise,
          total: quote.totalPaise,
          status: "pending",
          paymentMethod: "razorpay",
          paymentStatus: "pending",
          razorpayOrderId,
          razorpayPaymentId: "",
          shippingName: input.shipping.name,
          shippingPhone: input.shipping.phone,
          shippingLine1: input.shipping.line1,
          shippingLine2: input.shipping.line2 || "",
          shippingCity: input.shipping.city,
          shippingState: input.shipping.state,
          shippingPincode: input.shipping.pincode,
          note: fullNote,
          idempotencyKey: input.idempotencyKey,
        },
        { transaction: t }
      );

      await OrderItem.create(
        {
          id: randomUUID(),
          orderId,
          productId: quote.product.id,
          slug: quote.product.slug,
          name: quote.product.name,
          image: quote.product.image,
          ml: quote.product.ml,
          qty: quote.product.qty,
          unitPrice: quote.unitPricePaise,
          lineTotal: quote.subtotalPaise,
        },
        { transaction: t }
      );

      await OrderStatusHistory.create(
        {
          id: randomUUID(),
          orderId,
          status: "pending",
          at: new Date(),
        },
        { transaction: t }
      );
      // IMPORTANT: Never touch Cart or CartItem for Direct Buy Now!
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not initialize Buy Now checkout.";
    return { ok: false, status: 409, message: msg };
  }

  if (cfg.configured) {
    return {
      ok: true,
      mode: "razorpay",
      isTestMode: cfg.isTestMode,
      keyId: cfg.keyId,
      razorpayOrderId,
      amountPaise: quote.totalPaise,
      currency: "INR",
      orderNumber,
      orderId,
    };
  }

  return {
    ok: true,
    mode: "demo",
    isTestMode: true,
    razorpayOrderId,
    demoToken: signDemoToken(orderId, razorpayOrderId),
    amountPaise: quote.totalPaise,
    currency: "INR",
    orderNumber,
    orderId,
  };
}

export async function verifyBuyNowPayment(
  userId: string,
  input: BuyNowVerifyInput
): Promise<
  | {
      ok: true;
      paymentState: "paid" | "demo";
      alreadyVerified?: boolean;
      isTestMode: boolean;
      isDemo: boolean;
      orderNumber: string;
    }
  | {
      ok: false;
      status: number;
      paymentState: "failed" | "pending" | "cancelled" | "error";
      message: string;
    }
> {
  await connectDB();
  const sequelize = getSequelize();
  const cfg = getRazorpayConfig();

  return sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { orderNumber: input.orderNumber, userId },
      include: [{ model: OrderItem, as: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) {
      return { ok: false, status: 404, paymentState: "error", message: "Order not found." };
    }

    // Prevent duplicate payment processing when callbacks repeat
    if (order.paymentStatus === "paid") {
      return {
        ok: true,
        paymentState: "paid",
        alreadyVerified: true,
        isTestMode: cfg.isTestMode,
        isDemo: false,
        orderNumber: order.orderNumber,
      };
    }

    if (order.razorpayOrderId !== input.razorpay_order_id) {
      return {
        ok: false,
        status: 400,
        paymentState: "error",
        message: "Mismatched payment order ID.",
      };
    }

    const isDemoOrder = order.razorpayOrderId.startsWith("order_demo_");

    // 1. Cancelled by customer
    if (input.statusAction === "cancelled") {
      const updatedNote = order.note.includes("Payment cancelled by user")
        ? order.note
        : `${order.note} | Payment cancelled by customer (awaiting retry)`.trim();
      await order.update({ note: updatedNote }, { transaction: t });
      return {
        ok: false,
        status: 200,
        paymentState: "cancelled",
        message: "Payment was cancelled. Your order details are preserved so you can retry.",
      };
    }

    // 2. Pending state
    if (input.statusAction === "pending") {
      await order.update({ paymentStatus: "pending", status: "pending" }, { transaction: t });
      return {
        ok: false,
        status: 200,
        paymentState: "pending",
        message: "Payment is pending confirmation from your UPI app. Please check again shortly or retry.",
      };
    }

    // 3. Failed state
    if (input.statusAction === "failed") {
      const reason = input.failureReason || "UPI transaction failed or was declined.";
      await order.update(
        {
          paymentStatus: "failed",
          note: `${order.note} | Failure: ${reason}`.trim(),
        },
        { transaction: t }
      );
      return {
        ok: false,
        status: 400,
        paymentState: "failed",
        message: reason,
      };
    }

    // 4. Success Verification
    if (isDemoOrder) {
      // Verify server-issued HMAC token so demo verification isn't blindly accepted
      if (!verifyDemoToken(order.id, order.razorpayOrderId, input.demoToken)) {
        return {
          ok: false,
          status: 400,
          paymentState: "error",
          message: "Invalid demo session verification token.",
        };
      }

      const demoPayId =
        input.razorpay_payment_id && input.razorpay_payment_id.startsWith("pay_demo_")
          ? input.razorpay_payment_id
          : `pay_demo_${randomUUID().replace(/-/g, "").slice(0, 14)}`;

      // Per Security Requirements: Demo simulation must NOT create a real paid order.
      // Keep paymentStatus = "pending" and status = "pending", clearly labelled in note!
      const updatedNote = order.note.includes("[DEMO TEST VERIFIED]")
        ? order.note
        : `${order.note} | [DEMO TEST VERIFIED]`.trim();

      await order.update(
        {
          razorpayPaymentId: demoPayId,
          paymentStatus: "pending",
          status: "pending",
          note: updatedNote,
        },
        { transaction: t }
      );

      return {
        ok: true,
        paymentState: "demo",
        isTestMode: true,
        isDemo: true,
        orderNumber: order.orderNumber,
      };
    }

    // Real Razorpay verification (Test Mode or Live Mode)
    if (!cfg.configured) {
      return {
        ok: false,
        status: 500,
        paymentState: "error",
        message: "Razorpay credentials are not configured on the server.",
      };
    }

    const sigValid = verifyRazorpaySignature(
      input.razorpay_order_id,
      input.razorpay_payment_id,
      input.razorpay_signature,
      cfg.keySecret
    );

    if (!sigValid) {
      await order.update(
        {
          paymentStatus: "failed",
          note: `${order.note} | Signature verification failed`.trim(),
        },
        { transaction: t }
      );
      return {
        ok: false,
        status: 400,
        paymentState: "failed",
        message: "Payment signature verification failed.",
      };
    }

    // Also fetch payment status directly from Razorpay API for secondary server verification
    const auth = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
    try {
      const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(input.razorpay_payment_id)}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (rzpPayRes.ok) {
        const rzpPay = await rzpPayRes.json();
        if (rzpPay.status === "created") {
          return {
            ok: false,
            status: 200,
            paymentState: "pending",
            message: "Payment is still awaiting confirmation from Razorpay.",
          };
        }
        if (rzpPay.status === "failed") {
          await order.update(
            { paymentStatus: "failed", note: `${order.note} | Gateway reported failure`.trim() },
            { transaction: t }
          );
          return {
            ok: false,
            status: 400,
            paymentState: "failed",
            message: rzpPay.error_description || "Payment failed at payment gateway.",
          };
        }
        if (typeof rzpPay.amount === "number" && rzpPay.amount !== order.total) {
          return {
            ok: false,
            status: 400,
            paymentState: "failed",
            message: "Paid amount does not match order total.",
          };
        }
      }
    } catch {
      // Signature already cryptographically verified above via HMAC-SHA256
    }

    // Decrement product stock atomically
    const items = order.items || [];
    for (const item of items) {
      const p = await Product.findOne({
        where: { id: item.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!p || p.stock < item.qty) {
        return {
          ok: false,
          status: 409,
          paymentState: "failed",
          message: `Insufficient stock for ${item.name}. Please contact support if amount was debited.`,
        };
      }
      p.stock -= item.qty;
      await p.save({ transaction: t });
    }

    // Mark order as paid & confirmed
    await order.update(
      {
        razorpayPaymentId: input.razorpay_payment_id,
        paymentStatus: "paid",
        status: "confirmed",
      },
      { transaction: t }
    );

    await OrderStatusHistory.create(
      {
        id: randomUUID(),
        orderId: order.id,
        status: "confirmed",
        at: new Date(),
      },
      { transaction: t }
    );

    return {
      ok: true,
      paymentState: "paid",
      isTestMode: cfg.isTestMode,
      isDemo: false,
      orderNumber: order.orderNumber,
    };
  });
}

