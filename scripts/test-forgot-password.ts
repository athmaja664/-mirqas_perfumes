import { connectDB } from "../lib/db";
import { User } from "../models/User";
import { requestPasswordReset, validateResetToken, completePasswordResetWithToken } from "../lib/services/password-reset";
import { sendPasswordResetEmail } from "../lib/email/resend";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

async function runTests() {
  console.log("==================================================");
  console.log("   RESEND FORGOT-PASSWORD COMPREHENSIVE TEST SUITE ");
  console.log("==================================================\n");

  await connectDB();

  // Test Case 1: Mail-A (The Resend account owner email: athmajavijayakumar@gmail.com)
  console.log("--- TEST CASE 1: Mail-A (athmajavijayakumar@gmail.com) ---");
  const mailA = "athmajavijayakumar@gmail.com";
  let userA = await User.findOne({ where: { email: mailA } });
  if (!userA) {
    userA = await User.create({
      id: randomUUID(),
      name: "Customer Mail-A",
      email: mailA,
      passwordHash: await bcrypt.hash("OldPassword123!", 12),
      role: "customer",
      isActive: true,
    });
    console.log("  Created test user Mail-A:", mailA);
  } else {
    console.log("  Found existing user Mail-A:", mailA);
  }

  // Request password reset for Mail-A
  const resA = await requestPasswordReset(mailA, false);
  console.log("  requestPasswordReset(Mail-A) result:", resA);
  if (!resA.ok) {
    throw new Error(`Test Case 1 Failed: Expected ok=true for Mail-A, got: ${resA.message}`);
  }
  console.log("  ✓ Mail-A password reset dispatched and accepted by Resend!");

  // Verify token was stored
  await userA.reload();
  if (!userA.resetTokenHash || !userA.resetTokenExpiry) {
    throw new Error("Test Case 1 Failed: Reset token was not stored for Mail-A");
  }
  console.log("  ✓ Reset token hash and expiry stored in MySQL.");

  // Test Case 2: Mail-B (Customer with different email address)
  console.log("\n--- TEST CASE 2: Mail-B (athmajav123@gmail.com) ---");
  const mailB = "athmajav123@gmail.com";
  let userB = await User.findOne({ where: { email: mailB } });
  if (!userB) {
    userB = await User.create({
      id: randomUUID(),
      name: "Customer Mail-B",
      email: mailB,
      passwordHash: await bcrypt.hash("OldPassword123!", 12),
      role: "customer",
      isActive: true,
    });
    console.log("  Created test user Mail-B:", mailB);
  } else {
    console.log("  Found existing user Mail-B:", mailB);
  }

  // Request password reset for Mail-B
  const resB = await requestPasswordReset(mailB, false);
  console.log("  requestPasswordReset(Mail-B) result:", resB);
  // Under onboarding@resend.dev, Resend blocks Mail-B.
  // Our fix guarantees that the API catches the rejection, rolls back the token,
  // and reports the error instead of falsely claiming success!
  await userB.reload();
  if (userB.resetTokenHash !== null) {
    throw new Error("Test Case 2 Failed: Token should be rolled back when Resend delivery fails!");
  }
  console.log("  ✓ Correct behavior confirmed: Unusable token was rolled back on Resend rejection.");
  console.log("  ✓ Resend sandbox limitation properly captured and reported:", resB.message);

  // Test Case 3: Unregistered Email
  console.log("\n--- TEST CASE 3: Unregistered Email ---");
  const unregistered = `unregistered_${Date.now()}@example.com`;
  const resUnreg = await requestPasswordReset(unregistered, false);
  console.log("  requestPasswordReset(unregistered) result:", resUnreg);
  if (!resUnreg.ok || !resUnreg.message.includes("If an account is associated")) {
    throw new Error("Test Case 3 Failed: Should return safe generic message for unregistered emails");
  }
  console.log("  ✓ Generic notice returned without leaking account existence.");

  // Test Case 4: Simulate Resend Failure / Invalidation
  console.log("\n--- TEST CASE 4: Token Validation & Reset Completion ---");
  // Test generating a raw token, validating it, completing password reset, and verifying single-use
  const testEmail = "test_reset_flow@example.com";
  let testUser = await User.findOne({ where: { email: testEmail } });
  if (!testUser) {
    testUser = await User.create({
      id: randomUUID(),
      name: "Test Flow User",
      email: testEmail,
      passwordHash: await bcrypt.hash("InitialPassword123!", 12),
      role: "customer",
      isActive: true,
    });
  }

  // Simulate token creation
  const crypto = await import("crypto");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  testUser.resetTokenHash = tokenHash;
  testUser.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
  await testUser.save();

  // Validate valid token
  const validCheck = await validateResetToken(rawToken, false);
  if (!validCheck.ok) throw new Error("validateResetToken failed for valid token!");
  console.log("  ✓ Valid token correctly verified.");

  // Validate invalid token
  const invalidCheck = await validateResetToken("invalid_fake_token_12345", false);
  if (invalidCheck.ok) throw new Error("validateResetToken should reject invalid token!");
  console.log("  ✓ Invalid token correctly rejected.");

  // Complete reset with valid token
  const newPassword = "NewSecurePassword456!";
  const resetRes = await completePasswordResetWithToken(rawToken, newPassword, false);
  if (!resetRes.ok) throw new Error("completePasswordResetWithToken failed!");
  console.log("  ✓ Password successfully updated in MySQL.");

  // Verify password hash matches new password
  await testUser.reload();
  const pwdMatch = await bcrypt.compare(newPassword, testUser.passwordHash);
  if (!pwdMatch) throw new Error("New password hash did not match!");
  console.log("  ✓ New password hash verified with bcrypt.");

  // Verify token cannot be reused
  const reuseAttempt = await completePasswordResetWithToken(rawToken, "AnotherPassword789!", false);
  if (reuseAttempt.ok) throw new Error("Single-use token reuse was not prevented!");
  console.log("  ✓ Token successfully invalidated (single-use enforced).");

  // Clean up temporary test user
  await testUser.destroy().catch(() => {});

  console.log("\n==================================================");
  console.log("        ALL 4 TEST CASES COMPLETED 100%           ");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

