import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { query } from "../src/db/client.js";
import "dotenv/config";

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || "").trim();
    });
    return row;
  });
}

async function ensureGuest(fullName, email, phone) {
  const existing = await query("SELECT id FROM guests WHERE full_name = $1 AND COALESCE(phone,'') = COALESCE($2,'') LIMIT 1", [fullName, phone || null]);
  if (existing.rowCount > 0) return existing.rows[0].id;

  const inserted = await query(
    `INSERT INTO guests (full_name, email, phone)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [fullName, email || null, phone || null]
  );

  return inserted.rows[0].id;
}

async function importReservations(csvPath) {
  const rows = parseCsv(csvPath);
  let count = 0;

  for (const row of rows) {
    const guestId = await ensureGuest(row.guest_name, row.guest_email, row.guest_phone);

    await query(
      `INSERT INTO reservations (guest_id, source, payment_method, status, check_in, check_out, guests_count, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        guestId,
        row.source || "other",
        row.payment_method || "other",
        row.status || "completed",
        row.check_in,
        row.check_out,
        Number(row.guests_count || 1),
        Number(row.total_amount || 0),
        row.notes || "Migrado historico"
      ]
    );
    count += 1;
  }

  return count;
}

async function importSales(csvPath) {
  const rows = parseCsv(csvPath);
  let count = 0;

  for (const row of rows) {
    await query(
      `INSERT INTO sales (category, amount, payment_method, sale_date, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        row.category || "lodging",
        Number(row.amount || 0),
        row.payment_method || "other",
        row.sale_date,
        row.description || "Venta migrada"
      ]
    );
    count += 1;
  }

  return count;
}

const reservationsFile = process.argv[2] ? path.resolve(process.argv[2]) : null;
const salesFile = process.argv[3] ? path.resolve(process.argv[3]) : null;

if (!reservationsFile && !salesFile) {
  console.error("Uso: node scripts/import-historical.mjs <reservas.csv> <ventas.csv>");
  process.exit(1);
}

let reservationsImported = 0;
let salesImported = 0;

if (reservationsFile) reservationsImported = await importReservations(reservationsFile);
if (salesFile) salesImported = await importSales(salesFile);

console.log(`Migracion historica completada. Reservas: ${reservationsImported}, Ventas: ${salesImported}`);
