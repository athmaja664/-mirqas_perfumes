import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

type Cache = { sequelize: Sequelize | null; promise: Promise<Sequelize> | null };
const g = globalThis as unknown as { _sequelize?: Cache };
const cache: Cache = g._sequelize ?? (g._sequelize = { sequelize: null, promise: null });

const clean = (val?: string) => (val || "").trim().replace(/^["']|["']$/g, "");

export function getSequelize(): Sequelize {
  if (cache.sequelize) return cache.sequelize;

  const host = clean(process.env.DB_HOST || process.env.MYSQL_HOST) || "localhost";
  const port = Number(clean(process.env.DB_PORT || process.env.MYSQL_PORT)) || 3306;
  const database = clean(process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.MYSQL_DB) || "mirqas";
  const username = clean(process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQL_USERNAME) || "root";
  const password = clean(process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || process.env.MYSQL_PWD) || "";
  const sslVal = clean(process.env.DB_SSL || process.env.MYSQL_SSL).toLowerCase();
  const useSSL = sslVal === "true" || host.includes("tidbcloud.com");
  const rejectUnauthorized = clean(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== "false";

  cache.sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: useSSL
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized,
          },
        }
      : {},
  });

  return cache.sequelize;
}

export async function connectDB(): Promise<Sequelize> {
  const seq = getSequelize();
  if (cache.promise) return cache.promise;

  cache.promise = seq.authenticate().then(() => seq);
  try {
    await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return seq;
}

export const sequelize = getSequelize();
export { Op, fn, col, literal } from "sequelize";
