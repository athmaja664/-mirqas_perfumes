import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Order, OrderItem } from "@/models/Order";
import { getRazorpayConfig } from "@/lib/services/buy-now";

export const dynamic = "force-dynamic";

const ORDER_NUM_RE = /^MQ-\d{6}-[A-Z0-9]{6}$/;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { orderNumber: rawNumber } = await context.params;
  const orderNumber = (rawNumber || "").trim().toUpperCase();
  if (!ORDER_NUM_RE.test(orderNumber)) {
    return NextResponse.json({ error: "Invalid order number." }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findOne({
    where: { orderNumber, userId: user.id },
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const items = (order as Order & { items?: OrderItem[] }).items || [];
  const cfg = getRazorpayConfig();
  const isDemo = Boolean(order.razorpayOrderId?.startsWith("order_demo_"));
  const isDemoVerified = isDemo && Boolean(order.note?.includes("[DEMO TEST VERIFIED]"));
  const isPaid = order.paymentStatus === "paid";

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      offerTitle: order.offerTitle,
      total: order.total,
      currency: "INR",
      createdAt: order.createdAt,
      shipping: {
        name: order.shippingName,
        phone: order.shippingPhone,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        state: order.shippingState,
        pincode: order.shippingPincode,
      },
      items: items.map((it) => ({
        productId: it.productId,
        slug: it.slug,
        name: it.name,
        image: it.image,
        ml: it.ml,
        qty: it.qty,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      isDemo,
      isDemoVerified,
      isPaid,
      isVerified: isPaid || isDemoVerified,
      isTestMode: isDemo || cfg.isTestMode,
    },
  });
}

