import { query } from "../src/db/client.js";
import "dotenv/config";

const guest = await query(
  `INSERT INTO guests (full_name, email, phone) VALUES ($1, $2, $3) RETURNING id`,
  ["Cliente Demo", "demo@refugios.cl", "+56911111111"]
);

const guestId = guest.rows[0].id;

const reservation = await query(
  `INSERT INTO reservations (guest_id, source, payment_method, status, check_in, check_out, guests_count, total_amount, notes)
   VALUES ($1, 'web', 'transfer', 'confirmed', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 day', 2, 180000, 'Reserva demo')
   RETURNING id`,
  [guestId]
);

const reservationId = reservation.rows[0].id;

await query(
  `INSERT INTO sales (reservation_id, category, amount, payment_method, sale_date, description)
   VALUES ($1, 'lodging', 180000, 'transfer', CURRENT_DATE, 'Venta de alojamiento demo')`,
  [reservationId]
);

await query(
  `INSERT INTO expenses (category, amount, payment_method, expense_date, supplier, description)
   VALUES ('limpieza', 25000, 'cash', CURRENT_DATE, 'Proveedor Demo', 'Gasto demo')`
);

await query(
  `INSERT INTO documents (reservation_id, document_type, document_number, issue_date, amount, status)
   VALUES ($1, 'boleta', 'B-001', CURRENT_DATE, 180000, 'issued')`,
  [reservationId]
);

console.log("Datos demo insertados");
process.exit(0);
