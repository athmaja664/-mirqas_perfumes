import mysql from "mysql2/promise";
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";

const clean = (val?: string) => (val || "").trim().replace(/^["']|["']$/g, "");

async function main() {
  const host = clean(process.env.DB_HOST) || "localhost";
  const port = Number(clean(process.env.DB_PORT)) || 3306;
  const user = clean(process.env.DB_USER) || "root";
  const password = clean(process.env.DB_PASSWORD) || "";
  const database = clean(process.env.DB_NAME) || "mirqasperfumes_db";
  const useSSL = clean(process.env.DB_SSL).toLowerCase() === "true";

  console.log(`=== IMPORTING DATA DUMP TO ${database} (${host}:${port}) ===`);

  const dumpPath = path.join(process.cwd(), "scripts", "data-dump.sql");
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`data-dump.sql not found at ${dumpPath}`);
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: useSSL
      ? {
          minVersion: "TLSv1.2",
          rejectUnauthorized: clean(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== "false",
        }
      : undefined,
  });

  console.log("Connected to MySQL. Streaming and executing data-dump.sql...");
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  await conn.query("SET max_allowed_packet = 1073741824").catch(() => {});

  const fileStream = fs.createReadStream(dumpPath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentStmt = "";
  let stmtsExecuted = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("/*")) {
      continue;
    }

    currentStmt += line + "\n";
    if (trimmed.endsWith(";")) {
      try {
        await conn.query(currentStmt);
        stmtsExecuted++;
        if (stmtsExecuted % 20 === 0) {
          process.stdout.write(`\rExecuted ${stmtsExecuted} statements...`);
        }
      } catch (err: any) {
        console.error(`\nStatement error: ${err.message}`);
      }
      currentStmt = "";
    }
  }

  if (currentStmt.trim()) {
    await conn.query(currentStmt).catch(() => {});
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();

  console.log(`\nImport complete! Total statements executed: ${stmtsExecuted}`);
}

main().catch((err) => {
  console.error("Data dump import failed:", err);
  process.exit(1);
});

