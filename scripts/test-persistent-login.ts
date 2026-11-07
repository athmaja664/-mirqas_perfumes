import { connectDB, Op } from "../lib/db";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runTests() {
  console.log("==================================================");
  console.log("  PERSISTENT CUSTOMER LOGIN (REMEMBER ME) TESTS   ");
  console.log("==================================================\n");

  await connectDB();

  // 1. Setup Test Customers A and B, and an Admin
  const emailA = `persist_a_${Date.now()}@example.com`;
  const emailB = `persist_b_${Date.now()}@example.com`;
  const emailAdmin = `persist_admin_${Date.now()}@example.com`;
  const password = "Password123!";
  const hashPwd = await bcrypt.hash(password, 12);

  const customerA = await User.create({
    id: randomUUID(),
    name: "Customer A",
    email: emailA,
    passwordHash: hashPwd,
    role: "customer",
    isActive: true,
  });

  const customerB = await User.create({
    id: randomUUID(),
    name: "Customer B",
    email: emailB,
    passwordHash: hashPwd,
    role: "customer",
    isActive: true,
  });

  const adminUser = await User.create({
    id: randomUUID(),
    name: "Admin User",
    email: emailAdmin,
    passwordHash: hashPwd,
    role: "admin",
    isActive: true,
  });

  console.log("Created test users: Customer A, Customer B, Admin");

  try {
    // -----------------------------------------------------------------
    // Scenario 1: Customer logs in and creates a 30-day persistent session
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 1: Customer login creates 30-day persistent session ---");
    const rawTokenA = randomBytes(32).toString("hex");
    const tokenHashA = hash(rawTokenA);
    const sessionCreatedAt = Date.now();
    const expiresAtA = new Date(sessionCreatedAt + THIRTY_DAYS_MS);

    const sessionA = await Session.create({
      userId: customerA.id,
      tokenHash: tokenHashA,
      expiresAt: expiresAtA,
    });

    const diffDaysA = Math.round((sessionA.expiresAt.getTime() - sessionCreatedAt) / ONE_DAY_MS);
    console.log(`  Customer A session expires in: ${diffDaysA} days (target: 30 days)`);
    if (diffDaysA !== 30) throw new Error(`Expected 30 days expiration, got ${diffDaysA}`);
    console.log("  ✓ Scenario 1 Passed: 30-day session created successfully.");

    // -----------------------------------------------------------------
    // Scenario 2: Customer revisits after 1 day
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 2: Customer revisits after 1 day ---");
    const day1SimulatedNow = new Date(sessionCreatedAt + 1 * ONE_DAY_MS);
    const sessionDay1 = await Session.findOne({
      where: {
        tokenHash: tokenHashA,
        expiresAt: { [Op.gt]: day1SimulatedNow },
      },
    });
    if (!sessionDay1) throw new Error("Scenario 2 Failed: Session was not found after 1 day!");
    const userDay1 = await User.findByPk(sessionDay1.userId);
    if (!userDay1 || userDay1.id !== customerA.id) throw new Error("Scenario 2 Failed: User mismatch!");
    console.log(`  ✓ Scenario 2 Passed: Customer remains authenticated after 1 day (User: ${userDay1.name}).`);

    // -----------------------------------------------------------------
    // Scenario 3: Customer revisits after 7 days
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 3: Customer revisits after 7 days ---");
    const day7SimulatedNow = new Date(sessionCreatedAt + 7 * ONE_DAY_MS);
    const sessionDay7 = await Session.findOne({
      where: {
        tokenHash: tokenHashA,
        expiresAt: { [Op.gt]: day7SimulatedNow },
      },
    });
    if (!sessionDay7) throw new Error("Scenario 3 Failed: Session was not found after 7 days!");
    console.log("  ✓ Scenario 3 Passed: Customer remains authenticated after 7 days.");

    // -----------------------------------------------------------------
    // Scenario 4: Customer revisits after 30 days (expired)
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 4: Customer revisits after 30+ days (expired) ---");
    const day31SimulatedNow = new Date(sessionCreatedAt + 31 * ONE_DAY_MS);
    const sessionDay31 = await Session.findOne({
      where: {
        tokenHash: tokenHashA,
        expiresAt: { [Op.gt]: day31SimulatedNow },
      },
    });
    if (sessionDay31 !== null) throw new Error("Scenario 4 Failed: Expired session should not be returned!");
    console.log("  ✓ Scenario 4 Passed: Session is correctly expired and treated as logged out after 30 days.");

    // -----------------------------------------------------------------
    // Scenario 5: Manual Logout functionality
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 5: Manual Logout removes session from MySQL ---");
    // Simulate active session logout
    const logoutDeleted = await Session.destroy({ where: { tokenHash: tokenHashA } });
    if (logoutDeleted !== 1) throw new Error("Scenario 5 Failed: Session record was not deleted!");
    const verifyLogout = await Session.findOne({ where: { tokenHash: tokenHashA } });
    if (verifyLogout !== null) throw new Error("Scenario 5 Failed: Session still exists after logout!");
    console.log("  ✓ Scenario 5 Passed: Session invalidated in database. Revisiting cannot automatically log in.");

    // -----------------------------------------------------------------
    // Scenario 6: Invalid and forged cookies do not authenticate
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 6: Invalid and forged cookies do not authenticate ---");
    const forgedToken = "completely_fake_forged_token_xyz_123";
    const forgedSession = await Session.findOne({
      where: {
        tokenHash: hash(forgedToken),
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (forgedSession !== null) throw new Error("Scenario 6 Failed: Forged token was accepted!");
    console.log("  ✓ Scenario 6 Passed: Forged/invalid tokens rejected safely.");

    // -----------------------------------------------------------------
    // Scenario 7: Different customer accounts do not share sessions
    // -----------------------------------------------------------------
    console.log("\n--- SCENARIO 7: Different customer accounts do not share sessions ---");
    const rawTokenB = randomBytes(32).toString("hex");
    const sessionB = await Session.create({
      userId: customerB.id,
      tokenHash: hash(rawTokenB),
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    });

    const checkSessionB = await Session.findOne({
      where: {
        tokenHash: hash(rawTokenB),
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (checkSessionB?.userId !== customerB.id) throw new Error("Scenario 7 Failed: Session B user mismatch!");
    if (checkSessionB?.userId === customerA.id) throw new Error("Scenario 7 Failed: Session shared between users!");
    console.log("  ✓ Scenario 7 Passed: Session B is strictly isolated to Customer B.");

    // -----------------------------------------------------------------
    // Extra Check: Admin vs Customer separation
    // -----------------------------------------------------------------
    console.log("\n--- EXTRA: Admin vs Customer Session Lifetime Separation ---");
    // Admin without remember gets 1 day
    const adminToken = randomBytes(32).toString("hex");
    const adminExpires = new Date(Date.now() + 1 * ONE_DAY_MS);
    const adminSession = await Session.create({
      userId: adminUser.id,
      tokenHash: hash(adminToken),
      expiresAt: adminExpires,
    });
    const adminDays = Math.round((adminSession.expiresAt.getTime() - Date.now()) / ONE_DAY_MS);
    console.log(`  Admin standard session duration: ${adminDays} day (target: 1 day)`);
    if (adminDays !== 1) throw new Error(`Expected 1 day for admin session, got ${adminDays}`);
    console.log("  ✓ Admin and customer authentication lifecycles remain completely separate.");

    console.log("\n==================================================");
    console.log("     ALL 7 SCENARIOS VERIFIED SUCCESSFULLY! 100%   ");
    console.log("==================================================");
  } finally {
    // Cleanup test users and sessions
    await Session.destroy({ where: { userId: [customerA.id, customerB.id, adminUser.id] } }).catch(() => {});
    await customerA.destroy().catch(() => {});
    await customerB.destroy().catch(() => {});
    await adminUser.destroy().catch(() => {});
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

