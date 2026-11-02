import { Sequelize } from "sequelize";

type Cache = { sequelize: Sequelize | null; promise: Promise<Sequelize> | null };
const g = globalThis as unknown as { _sequelize?: Cache };
const cache: Cache = g._sequelize ?? (g._sequelize = { sequelize: null, promise: null });

export function getSequelize(): Sequelize {
  if (cache.sequelize) return cache.sequelize;

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const database = process.env.DB_NAME || "mirqas";
  const username = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const useSSL = process.env.DB_SSL === "true" || host.includes("tidbcloud.com");

  cache.sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
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