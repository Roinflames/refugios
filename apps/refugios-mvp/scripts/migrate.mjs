import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no definida");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrationsDir = path.join(process.cwd(), "db", "migrations");

function listMigrations() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

try {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = listMigrations();

  for (const filename of files) {
    const already = await client.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [filename]);
    if (already.rowCount > 0) {
      console.log(`skip ${filename}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
    await client.query("COMMIT");
    console.log(`applied ${filename}`);
  }

  console.log("Migraciones completadas");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error);
  process.exit(1);
} finally {
  await client.end();
}
