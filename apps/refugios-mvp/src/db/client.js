import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no definida");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
