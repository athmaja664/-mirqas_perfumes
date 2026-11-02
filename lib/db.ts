import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

type Cache = { sequelize: Sequelize | null; promise: Promise<Sequelize> | null };
const g = globalThis as unknown as { _sequelize?: Cache };
const cache: Cache = g._sequelize ?? (g._sequelize = { sequelize: null, promise: null });

const clean = (val?: string) => (val || "").trim().replace(/^["']|["']$/g, "");

export function getSequelize(): Sequelize {
  if (cache.sequelize) return cache.sequelize;

  const host = clean(process.env.DB_HOST) || "localhost";
  const port = Number(clean(process.env.DB_PORT)) || 3306;
  const database = clean(process.env.DB_NAME) || "mirqas";
  const username = clean(process.env.DB_USER) || "root";
  const password = clean(process.env.DB_PASSWORD) || "";
  const sslVal = clean(process.env.DB_SSL).toLowerCase();
  const useSSL = sslVal === "true" || host.includes("tidbcloud.com");

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
    dialectOptions: useSSL ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {},
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
