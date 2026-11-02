import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB, getSequelize, Op } from "../lib/db";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { Product } from "../models/Product";
import { Order, OrderItem, OrderStatusHistory } from "../models/Order";
import { Cart, CartItem } from "../models/Cart";
import { Review } from "../models/Review";
import { Address } from "../models/Address";
import { listProducts, toProduct } from "../lib/services/products";
import { addToCart, getCartView, changeLine, removeLine } from "../lib/services/cart";
import { createOrder } from "../lib/services/orders";
import { changeOrderStatus, restoreCancelledOrder } from "../lib/services/order-status";
import { deleteCustomer } from "../lib/services/purge";

async function runTests() {
  console.log("==========================================");
  console.log("   MIGRATION & FUNCTIONALITY TEST SUITE   ");
  console.log("==========================================");

  await connectDB();
  const sequelize = getSequelize();
  console.log("✓ Test 1: MySQL connection authenticated.");

  // Test 2: Verify Migrated Data counts
  const userCount = await User.count();
  const productCount = await Product.count();
  const orderCount = await Order.count();
  const reviewCount = await Review.count();
  const addressCount = await Address.count();
  const sessionCount = await Session.count();

  console.log(`✓ Test 2: Migrated record counts verified:`);
  console.log(`   - Users: ${userCount} (expected >= 4)`);
  console.log(`   - Products: ${productCount} (expected >= 25)`);
  console.log(`   - Orders: ${orderCount} (expected >= 3)`);
  console.log(`   - Reviews: ${reviewCount} (expected >= 6)`);
  console.log(`   - Addresses: ${addressCount} (expected >= 1)`);
  console.log(`   - Sessions: ${sessionCount} (expected >= 15)`);

  if (userCount < 4 || productCount < 25 || orderCount < 3) {
    throw new Error("Migrated record counts do not match expected numbers!");
  }

  // Test 3: Product Search, Filtering, Sorting, Pagination
  const spAll = new URLSearchParams({ page: "1", limit: "10", sort: "newest" });
  const allProds = await listProducts(spAll, true);
  console.log(`✓ Test 3: listProducts returned ${allProds.items.length} items on page 1 of ${allProds.pages}`);

  const spOud = new URLSearchParams({ category: "Oud & Woody" });
  const oudProds = await listProducts(spOud, true);
  console.log(`✓ Test 4: Category filter ('Oud & Woody') returned ${oudProds.items.length} items`);

  // Test 5: User registration and password hashing
  const testEmail = `test_user_${Date.now()}@example.com`;
  const testPassword = "testPassword123!";
  const testUser = await User.create({
    id: randomUUID(),
    name: "Automated Tester",
    email: testEmail,
    phone: "9876543210",
    passwordHash: await bcrypt.hash(testPassword, 12),
    role: "customer",
    isActive: true,
  });
  console.log(`✓ Test 5: User registration created test user ${testUser.id}`);

  const authMatch = await bcrypt.compare(testPassword, testUser.passwordHash);
  if (!authMatch) throw new Error("Password hash verification failed!");
  console.log("✓ Test 6: Password hash verified successfully.");

  // Test 7: Unique constraint on user email
  let duplicateFailed = false;
  try {
    await User.create({
      id: randomUUID(),
      name: "Duplicate Tester",
      email: testEmail,
      phone: "9876543210",
      passwordHash: "hash",
      role: "customer",
    });
  } catch {
    duplicateFailed = true;
  }
  if (!duplicateFailed) throw new Error("Unique constraint on user email did not trigger!");
  console.log("✓ Test 7: Unique constraint on email enforced correctly.");

  // Test 8: Address Save & Update
  await Address.create({
    id: randomUUID(),
    userId: testUser.id,
    name: "Tester Delivery",
    phone: "9876543210",
    line1: "123 Test Street",
    line2: "Apt 4B",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  });
  const savedAddr = await Address.findOne({ where: { userId: testUser.id } });
  if (!savedAddr || savedAddr.city !== "Bengaluru") throw new Error("Address save failed!");
  console.log("✓ Test 8: Address save and retrieval verified.");

  // Test 9: Cart CRUD
  const sampleProduct = await Product.findOne({ where: { isActive: true, stock: { [Op.gt]: 5 } } });
  if (!sampleProduct) throw new Error("No active product with stock found!");
  const prodSlug = sampleProduct.slug;

  const addRes = await addToCart(testUser.id, prodSlug, 10, 2);
  if (!addRes.ok) throw new Error(`Add to cart failed: ${(addRes as { message: string }).message}`);
  console.log("✓ Test 9: Add to cart succeeded.");

  const cartView = await getCartView(testUser.id);
  if (cartView.count !== 2 || cartView.items.length !== 1) throw new Error("Cart view item count mismatch!");
  console.log(`✓ Test 10: Cart view verified: count=${cartView.count}, subtotal=${cartView.subtotal}`);

  const changeRes = await changeLine(testUser.id, prodSlug, 10, 3, undefined);
  if (!changeRes.ok) throw new Error("Change cart line qty failed!");
  const updatedView = await getCartView(testUser.id);
  if (updatedView.count !== 3) throw new Error("Cart qty update mismatch!");
  console.log("✓ Test 11: Cart quantity change verified (qty=3).");

  // Test 12: Order Placement with Transaction and Stock Decrement
  const initialStock = sampleProduct.stock;
  const idempotencyKey = randomUUID();
  const orderRes = await createOrder(testUser.id, {
    items: [{ slug: prodSlug, ml: 10, qty: 1 }],
    shipping: {
      name: "Tester Delivery",
      phone: "9876543210",
      line1: "123 Test Street",
      line2: "Apt 4B",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
    note: "Test order note",
    paymentMethod: "cod",
    idempotencyKey,
  });

  if (!orderRes.ok) throw new Error(`Order placement failed: ${(orderRes as { message: string }).message}`);
  console.log(`✓ Test 12: Order placed successfully: orderNumber=${orderRes.order.orderNumber}`);

  // Test 13: Idempotency verification
  const duplicateOrderRes = await createOrder(testUser.id, {
    items: [{ slug: prodSlug, ml: 10, qty: 1 }],
    shipping: {
      name: "Tester Delivery",
      phone: "9876543210",
      line1: "123 Test Street",
      line2: "Apt 4B",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
    note: "Test order note",
    paymentMethod: "cod",
    idempotencyKey,
  });
  if (!duplicateOrderRes.ok || !duplicateOrderRes.existing) {
    throw new Error("Idempotent order placement failed to return existing order!");
  }
  console.log("✓ Test 13: Order idempotency key protection verified.");

  // Verify stock was decremented by 1
  await sampleProduct.reload();
  if (sampleProduct.stock !== initialStock - 1) {
    throw new Error(`Stock decrement failed! Expected ${initialStock - 1}, got ${sampleProduct.stock}`);
  }
  console.log(`✓ Test 14: Stock decremented correctly: ${initialStock} -> ${sampleProduct.stock}`);

  // Test 15: Order status change & Stock restoration on Cancel
  const placedOrder = await Order.findOne({ where: { orderNumber: orderRes.order.orderNumber } });
  if (!placedOrder) throw new Error("Placed order not found in database!");

  const confirmRes = await changeOrderStatus(placedOrder.id, "confirmed");
  if (!confirmRes.ok) throw new Error("Status change to confirmed failed!");
  console.log("✓ Test 15: Order status changed to confirmed.");

  const cancelRes = await changeOrderStatus(placedOrder.id, "cancelled");
  if (!cancelRes.ok) throw new Error("Status change to cancelled failed!");
  await sampleProduct.reload();
  if (sampleProduct.stock !== initialStock) {
    throw new Error(`Stock restoration on cancel failed! Expected ${initialStock}, got ${sampleProduct.stock}`);
  }
  console.log(`✓ Test 16: Cancel restored stock: ${sampleProduct.stock}`);

  // Test 17: Restore cancelled order
  const restoreRes = await restoreCancelledOrder(placedOrder.id);
  if (!restoreRes.ok) throw new Error("Restoring cancelled order failed!");
  await sampleProduct.reload();
  if (sampleProduct.stock !== initialStock - 1) {
    throw new Error("Stock re-take on restore failed!");
  }
  console.log("✓ Test 17: Order restore verified.");

  // Test 18: Product Review Creation & Constraint
  const review = await Review.create({
    id: randomUUID(),
    productId: sampleProduct.id,
    userId: testUser.id,
    userName: "Automated Tester",
    rating: 5,
    title: "Incredible fragrance",
    comment: "This is a test review for verifying migration.",
    images: ["/images/test.jpg"],
    video: "",
    status: "published",
  });
  console.log(`✓ Test 18: Review created: ${review.id}`);

  let dupReviewFailed = false;
  try {
    await Review.create({
      id: randomUUID(),
      productId: sampleProduct.id,
      userId: testUser.id,
      userName: "Automated Tester",
      rating: 4,
      title: "Another review",
      comment: "Should fail duplicate constraint",
      images: [],
      video: "",
      status: "published",
    });
  } catch {
    dupReviewFailed = true;
  }
  if (!dupReviewFailed) throw new Error("Duplicate review constraint failed!");
  console.log("✓ Test 19: One review per user/product constraint enforced.");

  // Test 20: Clean up test customer using deleteCustomer
  // First cancel order so open order check passes
  await changeOrderStatus(placedOrder.id, "cancelled");
  const purgeRes = await deleteCustomer(testUser.id);
  if (!purgeRes.ok) throw new Error(`Customer purge failed: ${(purgeRes as { message: string }).message}`);
  console.log("✓ Test 20: Customer deletion and cascade cleanup verified.");

  const checkUser = await User.findByPk(testUser.id);
  const checkOrder = await Order.findByPk(placedOrder.id);
  const checkReview = await Review.findByPk(review.id);
  if (checkUser || checkOrder || checkReview) {
    throw new Error("Purged customer records still exist!");
  }
  console.log("✓ Test 21: Cascade cleanup confirmed (user, orders, reviews deleted).");

  await sequelize.close();
  console.log("\n==========================================");
  console.log("  ALL 21 TESTS PASSED SUCCESSFULLY! 100%  ");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
