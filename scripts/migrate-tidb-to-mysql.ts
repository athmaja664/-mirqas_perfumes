import mysql, { ConnectionOptions } from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";

const clean = (val?: string) => (val || "").trim().replace(/^["']|["']$/g, "");

// Source TiDB Configuration
const sourceConfig: ConnectionOptions = {
  host: clean(process.env.TIDB_HOST) || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
  port: Number(clean(process.env.TIDB_PORT)) || 4000,
  user: clean(process.env.TIDB_USER) || "2dAYaeBpDpTxx3E.root",
  password: clean(process.env.TIDB_PASSWORD) || "RXpPH2KHJZO0i0GY",
  database: clean(process.env.TIDB_NAME) || "mirqas",
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
};

// Target MySQL Configuration
const targetConfig: ConnectionOptions = {
  host: clean(process.env.DB_HOST) || "localhost",
  port: Number(clean(process.env.DB_PORT)) || 3306,
  user: clean(process.env.DB_USER) || "root",
  password: clean(process.env.DB_PASSWORD) || "",
  database: clean(process.env.DB_NAME) || "mirqasperfumes_db",
  ssl: clean(process.env.DB_SSL).toLowerCase() === "true"
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: clean(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== "false",
      }
    : undefined,
};

const TABLES = [
  "users",
  "sessions",
  "products",
  "reviews",
  "addresses",
  "orders",
  "order_items",
  "order_status_history",
  "carts",
  "cart_items",
  "wishlists",
  "wishlist_items",
  "media_uploads",
  "media_chunks",
];

async function runSchema(targetConn: mysql.Connection) {
  const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${schemaPath}`);
  }
  const content = fs.readFileSync(schemaPath, "utf-8");
  const cleanSql = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("--"))
    .join("\n");

  const stmts = cleanSql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Applying schema (${stmts.length} statements)...`);
  for (const stmt of stmts) {
    await targetConn.query(stmt);
  }
  console.log("Schema applied successfully.");
}

export async function migrateFromTiDB() {
  console.log("=== MIRQAS PERFUMES: TIDB TO MYSQL MIGRATION ===");
  console.log(`Source TiDB: ${sourceConfig.host}:${sourceConfig.port}/${sourceConfig.database}`);
  console.log(`Target MySQL: ${targetConfig.host}:${targetConfig.port}/${targetConfig.database}`);

  console.log("\nConnecting to Target MySQL...");
  const targetConn = await mysql.createConnection({
    ...targetConfig,
    multipleStatements: true,
  });
  console.log("Connected to Target MySQL successfully.");

  // Apply schema first
  await runSchema(targetConn);

  console.log("\nConnecting to Source TiDB Cloud...");
  const sourceConn = await mysql.createConnection(sourceConfig);
  console.log("Connected to Source TiDB Cloud successfully.");

  await targetConn.query("SET FOREIGN_KEY_CHECKS = 0");

  const summary: Record<string, { read: number; inserted: number }> = {};

  for (const table of TABLES) {
    try {
      const [countRows] = (await sourceConn.query(
        `SELECT COUNT(*) AS cnt FROM \`${table}\``
      )) as unknown as [Array<{ cnt: number }>];
      const count = countRows[0]?.cnt || 0;
      console.log(`\nTable '${table}': found ${count} rows in TiDB.`);
      summary[table] = { read: count, inserted: 0 };

      if (count === 0) continue;

      // Determine batch size: 1 for media blob tables, 100 for regular tables
      const isMediaTable = table === "media_uploads" || table === "media_chunks";
      const batchSize = isMediaTable ? 1 : 100;

      for (let offset = 0; offset < count; offset += batchSize) {
        const [rows] = (await sourceConn.query(
          `SELECT * FROM \`${table}\` LIMIT ${batchSize} OFFSET ${offset}`
        )) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (!rows || rows.length === 0) break;

        for (const row of rows) {
          const keys = Object.keys(row);
          const cols = keys.map((k) => `\`${k}\``).join(", ");
          const placeholders = keys.map(() => "?").join(", ");
          const values = keys.map((k) => (row as any)[k]);

          const sql = `REPLACE INTO \`${table}\` (${cols}) VALUES (${placeholders})`;
          await targetConn.execute(sql, values);
          summary[table].inserted++;
        }

        if (!isMediaTable) {
          process.stdout.write(`\r  Migrated ${summary[table].inserted}/${count} rows...`);
        } else {
          process.stdout.write(`\r  Migrated media record ${summary[table].inserted}/${count}...`);
        }
      }
      process.stdout.write("\n");
    } catch (err: any) {
      console.error(`Error migrating table ${table}:`, err?.message || err);
    }
  }

  await targetConn.query("SET FOREIGN_KEY_CHECKS = 1");

  console.log("\n=== MIGRATION SUMMARY ===");
  console.table(summary);

  await sourceConn.end();
  await targetConn.end();
  console.log("\nMigration completed successfully!");
}

if (require.main === module || (process.argv[1] && process.argv[1].endsWith("migrate-tidb-to-mysql.ts"))) {
  migrateFromTiDB().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
