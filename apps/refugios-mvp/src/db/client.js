import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const needsSsl = connectionString && connectionString.includes("sslmode=require");
const pool = connectionString
  ? new Pool({
      connectionString,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {})
    })
  : null;

export async function query(text, params = []) {
  if (!pool) {
    const error = new Error("DATABASE_URL no definida");
    error.code = "MISSING_DATABASE_URL";
    throw error;
  }
  return pool.query(text, params);
}
