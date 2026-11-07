import fs from "fs";
import path from "path";

// Load .env.local into process.env before importing db
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import {
  calculatePercentagePrice,
  findInSizeMap,
  unitPricePaise,
} from "../lib/pricing";
import {
  evaluateOffers,
  createOffer,
  getOfferById,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getOfferMetrics,
} from "../lib/services/offers";
import { evaluateOffersClient } from "../lib/offerClient";
import { connectDB } from "../lib/db";
import { Product } from "../models/Product";
import { Order } from "../models/Order";

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING PRD VERIFICATION: OFFERS & ML-WISE PRICING");
  console.log("=================================================");

  // 1. Verify Percentage Calculation Formula
  console.log("\n[TEST 1] Testing Method B Percentage Calculation Formula...");
  // Formula: Price(S) = P * (1 + R/100)^((S - B)/I)
  // Base Price P = 1000, Base Size B = 10ml, Step I = 10ml, Rate R = 20%
  // 10ml: steps = 0 -> 1000 * 1^0 = 1000
  // 20ml: steps = 1 -> 1000 * 1.20 = 1200
  // 30ml: steps = 2 -> 1000 * (1.20)^2 = 1440
  const p10 = calculatePercentagePrice(1000, 10, 10, 10, 20);
  const p20 = calculatePercentagePrice(1000, 10, 20, 10, 20);
  const p30 = calculatePercentagePrice(1000, 10, 30, 10, 20);

  if (p10 !== 1000 || p20 !== 1200 || p30 !== 1440) {
    throw new Error(`Formula calculation failed: p10=${p10}, p20=${p20}, p30=${p30}`);
  }
  console.log("✓ Formula verified: 10ml=₹1000, 20ml=₹1200, 30ml=₹1440");

  // 2. Testing unitPricePaise with sizePrices & overrides
  console.log("\n[TEST 2] Testing unitPricePaise with real sizePrices and overrides...");
  const sampleProduct = {
    price: 149900,
    sizePrices: {
      "10ml": 89900,
      "15ml": 119900,
      "50ml": 249900,
    },
    pricingMethod: "percentage",
  };

  const price10 = unitPricePaise(sampleProduct, 10);
  const price15 = unitPricePaise(sampleProduct, 15);
  const price50 = unitPricePaise(sampleProduct, 50);

  if (price10 !== 89900 || price15 !== 119900 || price50 !== 249900) {
    throw new Error(`Manual sizePrices lookup failed: 10ml=${price10}, 15ml=${price15}, 50ml=${price50}`);
  }
  console.log("✓ Manual sizePrices correctly resolved: 10ml=₹899, 15ml=₹1199, 50ml=₹2499");

  // 3. Test Database Persistence of Product with Pricing Methods
  console.log("\n[TEST 3] Testing Product Model with Database Persistence...");
  await connectDB();

  // Create a test product with manual pricing
  const testProduct = await Product.create({
    name: "Test Pricing Perfume " + Date.now(),
    slug: "test-pricing-" + Date.now(),
    brand: "Mirqas Test",
    description: "Automated test for ML-wise pricing",
    price: 199900,
    salePrice: 179900,
    category: "Woody",
    stock: 50,
    isActive: true,
    pricingMethod: "percentage",
    sizePrices: {
      "10ml": 99900,
      "15ml": 129900,
      "30ml": 189900,
      "50ml": 279900,
      "100ml": 459900,
    },
  });

  const fetchedProduct = await Product.findByPk(testProduct.id);
  if (!fetchedProduct || !fetchedProduct.sizePrices || fetchedProduct.sizePrices["50ml"] !== 279900) {
    throw new Error("Failed to persist product sizePrices to MySQL database");
  }
  console.log("✓ Product with sizePrices persisted and fetched from MySQL successfully:", fetchedProduct.id);

  // 4. Test Offers Creation & Management
  console.log("\n[TEST 4] Testing Admin Offers Management (CRUD & Metrics)...");
  const offer = await createOffer({
    title: "Buy 2 for ₹2599 Special Deal " + Date.now(),
    description: "Buy any two 50ml bottles for ₹2599",
    offerType: "quantity",
    offerPrice: 259900, // ₹2599
    requiredQuantity: 2,
    eligibleSizes: ["50ml"],
    allowMixedVariants: true,
    applicableToAll: false,
    displayHomepage: true,
    displayListing: true,
    displayProductDetails: true,
    status: "published",
    productIds: [fetchedProduct.id],
  });

  if (!offer || !offer.id) {
    throw new Error("Failed to create offer");
  }
  console.log("✓ Created Offer successfully:", offer.id, offer.title);

  const metrics = await getOfferMetrics();
  console.log("✓ Offer metrics calculated:", metrics);
  if (metrics.total < 1 || metrics.active < 1) {
    throw new Error("Metrics count mismatch");
  }

  // 5. Test Cart Discount Evaluation Logic
  console.log("\n[TEST 5] Testing Cart Offer Evaluation...");

  // Scenario A: Customer adds only 1 bottle of 50ml (Does NOT meet required 2)
  const cartScenarioA = [
    {
      productId: fetchedProduct.id,
      slug: fetchedProduct.slug,
      ml: 50,
      qty: 1,
      unitPrice: 279900,
    },
  ];
  const evalA = evaluateOffers(cartScenarioA, [offer]);
  if (evalA !== null) {
    throw new Error("Offer should not apply when quantity < requiredQuantity");
  }
  console.log("✓ Scenario A: 1 bottle does NOT trigger offer discount (correct).");

  // Scenario B: Customer adds 2 bottles of 50ml (Meets required 2)
  // Regular total = 2 * 2799 = ₹5598 (559800 paise)
  // Offer special total = ₹2599 (259900 paise)
  // Expected discount = 559800 - 259900 = 299900 paise (₹2999)
  const cartScenarioB = [
    {
      productId: fetchedProduct.id,
      slug: fetchedProduct.slug,
      ml: 50,
      qty: 2,
      unitPrice: 279900,
    },
  ];
  const evalB = evaluateOffers(cartScenarioB, [offer]);
  if (!evalB || evalB.discountTotal !== 299900) {
    throw new Error(`Scenario B failed: expected discount 299900 paise, got ${evalB?.discountTotal}`);
  }
  console.log("✓ Scenario B: 2 bottles triggers discount of ₹" + evalB.discountTotal / 100 + " (correct).");

  // Scenario C: Size restriction check - Customer adds 2 bottles of 10ml (Offer requires 50ml)
  const cartScenarioC = [
    {
      productId: fetchedProduct.id,
      slug: fetchedProduct.slug,
      ml: 10,
      qty: 2,
      unitPrice: 99900,
    },
  ];
  const evalC = evaluateOffers(cartScenarioC, [offer]);
  if (evalC !== null) {
    throw new Error("Offer should not apply to ineligible 10ml size");
  }
  console.log("✓ Scenario C: Ineligible size (10ml) is correctly rejected.");

  // Scenario D: Client-side Offer Evaluator check
  const clientEval = evaluateOffersClient(cartScenarioB, [offer]);
  if (!clientEval || clientEval.discountTotal !== 299900) {
    throw new Error("Client-side offer evaluator failed");
  }
  console.log("✓ Client-side offer evaluation matches server calculation perfectly.");

  // 6. Test Status Toggle and Expiration
  console.log("\n[TEST 6] Testing Quick Status Toggle & Deactivation...");
  const unpublished = await toggleOfferStatus(offer.id, "unpublished");
  if (!unpublished || unpublished.status !== "unpublished") {
    throw new Error("Failed to unpublish offer");
  }
  console.log("✓ Offer unpublished successfully.");

  // 7. Cleanup test data
  console.log("\n[CLEANUP] Cleaning up test records...");
  await deleteOffer(offer.id);
  await fetchedProduct.destroy();
  console.log("✓ Cleaned up test offer and test product.");

  console.log("\n=================================================");
  console.log("ALL PRD TESTS PASSED SUCCESSFULLY! (100% SUCCESS)");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
