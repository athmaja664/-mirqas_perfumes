import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function runMigration() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found at " + envPath);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST || "localhost",
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "mirqasperfumes_db",
  });

  console.log("Connected to MySQL database:", env.DB_NAME);

  // Helper to check if a column exists
  async function columnExists(table: string, column: string): Promise<boolean> {
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?;`,
      [env.DB_NAME, table, column]
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  // 1. Extend products table
  console.log("Checking columns on 'products' table...");
  if (!(await columnExists("products", "sizePrices"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN sizePrices JSON NULL;`);
    console.log("Added sizePrices to products.");
  }
  if (!(await columnExists("products", "pricingMethod"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN pricingMethod VARCHAR(20) NOT NULL DEFAULT 'manual';`);
    console.log("Added pricingMethod to products.");
  }
  if (!(await columnExists("products", "baseSize"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN baseSize INT NULL;`);
    console.log("Added baseSize to products.");
  }
  if (!(await columnExists("products", "basePrice"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN basePrice INT NULL;`);
    console.log("Added basePrice to products.");
  }
  if (!(await columnExists("products", "sizeIncrement"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN sizeIncrement INT NULL;`);
    console.log("Added sizeIncrement to products.");
  }
  if (!(await columnExists("products", "percentageIncrease"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN percentageIncrease DECIMAL(5,2) NULL;`);
    console.log("Added percentageIncrease to products.");
  }
  if (!(await columnExists("products", "priceOverrides"))) {
    await conn.query(`ALTER TABLE products ADD COLUMN priceOverrides JSON NULL;`);
    console.log("Added priceOverrides to products.");
  }

  // 2. Extend orders table
  console.log("Checking columns on 'orders' table...");
  if (!(await columnExists("orders", "discountTotal"))) {
    await conn.query(`ALTER TABLE orders ADD COLUMN discountTotal INT NOT NULL DEFAULT 0;`);
    console.log("Added discountTotal to orders.");
  }
  if (!(await columnExists("orders", "offerId"))) {
    await conn.query(`ALTER TABLE orders ADD COLUMN offerId VARCHAR(36) NULL;`);
    console.log("Added offerId to orders.");
  }
  if (!(await columnExists("orders", "offerTitle"))) {
    await conn.query(`ALTER TABLE orders ADD COLUMN offerTitle VARCHAR(255) NULL;`);
    console.log("Added offerTitle to orders.");
  }

  // 3. Create offers table
  console.log("Creating 'offers' table if not exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS offers (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      offerType ENUM('quantity', 'percentage', 'fixed') NOT NULL,
      offerPrice INT NULL,
      discountValue DECIMAL(10,2) NULL,
      requiredQuantity INT NOT NULL DEFAULT 1,
      eligibleSizes JSON NOT NULL,
      allowMixedVariants TINYINT(1) NOT NULL DEFAULT 1,
      applicableToAll TINYINT(1) NOT NULL DEFAULT 0,
      displayHomepage TINYINT(1) NOT NULL DEFAULT 1,
      displayListing TINYINT(1) NOT NULL DEFAULT 1,
      displayProductDetails TINYINT(1) NOT NULL DEFAULT 1,
      bannerImage VARCHAR(500) NULL,
      startDate DATETIME NULL,
      endDate DATETIME NULL,
      status ENUM('draft', 'published', 'unpublished') NOT NULL DEFAULT 'draft',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_offers_status (status),
      INDEX idx_offers_dates (startDate, endDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("'offers' table ready.");

  // 4. Create offer_products table
  console.log("Creating 'offer_products' table if not exists...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS offer_products (
      id VARCHAR(36) PRIMARY KEY,
      offerId VARCHAR(36) NOT NULL,
      productId VARCHAR(36) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_op_offer (offerId),
      INDEX idx_op_product (productId),
      CONSTRAINT fk_op_offer FOREIGN KEY (offerId) REFERENCES offers (id) ON DELETE CASCADE,
      CONSTRAINT fk_op_product FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("'offer_products' table ready.");

  await conn.end();
  console.log("Schema migration completed successfully!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

