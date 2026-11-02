import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";

export async function initDatabase() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const database = process.env.DB_NAME || "mirqas";
  const username = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const useSSL = process.env.DB_SSL === "true" || host.includes("tidbcloud.com");

  console.log(`Connecting to MySQL ${host}:${port}/${database}...`);
  const sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: "mysql",
    logging: false,
    dialectOptions: useSSL ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {},
  });

  await sequelize.authenticate();
  console.log("Connected to MySQL successfully!");

  const sqlPath = path.join(process.cwd(), "scripts", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Remove single line comments
  const cleanSql = sql
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("--"))
    .join("\n");

  // Split by semicolon followed by newline or end of file
  const statements = cleanSql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Verifying ${statements.length} table definitions...`);
  for (const stmt of statements) {
    if (!stmt) continue;
    await sequelize.query(stmt);
  }

  console.log("All tables, indexes, and constraints verified successfully!");
  await sequelize.close();
}

if (process.argv[1]?.endsWith("init-db.ts")) {
  initDatabase().catch((err) => {
    console.error("Error creating database schema:", err);
    process.exit(1);
  });
}
