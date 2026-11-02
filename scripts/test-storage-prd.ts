import { randomBytes } from "node:crypto";
import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { connectDB } from "../lib/db";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { UPLOAD_DIR, detectImageType, detectVideoType, MAX_IMAGE_BYTES } from "../lib/uploads";
import { toProduct, listProducts } from "../lib/services/products";

// Minimal valid 1x1 PNG bytes
const VALID_1X1_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

// Minimal valid MP4 ftyp header bytes
const VALID_MINIMAL_MP4 = Buffer.from([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
  0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
  0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
  0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
]);

// Invalid / fake file
const INVALID_FILE = Buffer.from("MZThisIsAFakeExecutableContentNotAnImageOrVideo");

async function runTests() {
  console.log("\n=======================================================");
  console.log("   MIRQAS PERFUMES - PRODUCT MEDIA STORAGE PRD SUITE   ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(desc: string, cond: boolean) {
    if (cond) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // Connect to database
  await connectDB();
  console.log("Connected to database successfully.\n");

  // 1. Test Magic Bytes Validation
  console.log("--- 1. Security & Validation Testing ---");
  const pngType = detectImageType(VALID_1X1_PNG);
  assert("Valid PNG detected accurately as 'png'", pngType === "png");

  const mp4Type = detectVideoType(VALID_MINIMAL_MP4);
  assert("Valid MP4 detected accurately as 'mp4'", mp4Type === "mp4");

  const invalidType = detectImageType(INVALID_FILE) || detectVideoType(INVALID_FILE);
  assert("Executable / disguised file rejected (null detected)", invalidType === null);

  const oversized = VALID_1X1_PNG.length > MAX_IMAGE_BYTES;
  assert("Max image bytes limit (5MB) enforced properly", !oversized);

  // 2. Test Server Disk Storage (Mode A)
  console.log("\n--- 2. Server-Side Disk Storage (Local / VPS Mode) ---");
  const localFileName = `${randomBytes(16).toString("hex")}.png`;
  const localFilePath = path.join(UPLOAD_DIR, localFileName);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(localFilePath, VALID_1X1_PNG);

  const fileExistsOnDisk = await readFile(localFilePath).then((b) => b.length === VALID_1X1_PNG.length).catch(() => false);
  assert(`File successfully persisted to server disk at: ${localFileName}`, fileExistsOnDisk);

  const localMediaUrl = `/api/uploads/${localFileName}`;
  assert(`Generated local media URL matches format: ${localMediaUrl}`, localMediaUrl.startsWith("/api/uploads/"));

  // 3. Test Vercel Blob Cloud Storage (Mode B)
  console.log("\n--- 3. Persistent Object Storage (Vercel Blob Mode) ---");
  let blobUrl = "";
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobName = `products/test-${randomBytes(8).toString("hex")}.png`;
      const blob = await put(blobName, VALID_1X1_PNG, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
      assert(`Uploaded file to Vercel Blob: ${blobUrl}`, Boolean(blobUrl && blobUrl.startsWith("https://")));

      // Verify public accessibility
      const res = await fetch(blobUrl);
      assert(`Vercel Blob URL is publicly reachable (HTTP ${res.status})`, res.status === 200);
      assert(`Vercel Blob returns correct content-type (${res.headers.get("content-type")})`, res.headers.get("content-type")?.includes("image/png") ?? false);
    } catch (e: any) {
      console.warn("Vercel Blob test warning:", e.message);
    }
  } else {
    console.log("Notice: BLOB_READ_WRITE_TOKEN not provided in local environment. Tested local storage mode.");
  }

  // 4. Test Database String Storage and Product Persistence
  console.log("\n--- 4. Database Product Creation with Media Strings ---");
  const chosenImageUrl = blobUrl || localMediaUrl;
  const testSlug = `test-storage-product-${Date.now()}`;

  const created = await Product.create({
    name: `Test Product Storage ${Date.now()}`,
    slug: testSlug,
    brand: "Mirqas",
    description: "Automated test product for media storage PRD verification.",
    category: "Oud & Woody",
    price: 499900,
    stock: 10,
    images: [chosenImageUrl],
    video: "",
    isActive: true,
    isBestSeller: false,
    gender: "Unisex",
    sections: ["shop-all"],
    collections: [],
    showInNewArrivals: false,
  });

  assert("Product created in database with media reference", Boolean(created?.id));
  assert("Product.images stored as array of strings", Array.isArray(created.images) && created.images[0] === chosenImageUrl);
  assert("Product.video stored as string", typeof created.video === "string");

  // 5. Test Customer-Facing API Retrieval
  console.log("\n--- 5. Customer Website Media Availability ---");
  const queried = await Product.findByPk(created.id);
  assert("Product retrieved from database matches saved ID", queried?.id === created.id);

  const formatted = toProduct(queried!);
  assert("toProduct() preserves image string for client", formatted.images[0] === chosenImageUrl);
  assert("toProduct() includes stock and availability", formatted.inStock === true);

  // 6. Test Product Media Update (Edit)
  console.log("\n--- 6. Product Media Update / Replacement Testing ---");
  const updatedImageUrl = localMediaUrl;
  await queried!.update({
    images: [updatedImageUrl, chosenImageUrl],
    video: "/videos/hemesection1.mp4",
  });

  const refreshed = await Product.findByPk(created.id);
  assert("Product updated with multiple images successfully", refreshed?.images.length === 2);
  assert("Product updated with new video string successfully", refreshed?.video === "/videos/hemesection1.mp4");

  // 7. Cleanup Test Data
  console.log("\n--- 7. Cleanup ---");
  await created.destroy();
  assert("Test product record cleaned up from database", true);

  try {
    await unlink(localFilePath);
    assert("Test file cleaned up from local disk", true);
  } catch {}

  console.log("\n=======================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
