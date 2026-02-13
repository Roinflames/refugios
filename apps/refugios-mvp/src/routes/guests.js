import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

function normalizeDocumentId(value) {
  return String(value || "")
    .replace(/[.\s-]/g, "")
    .toUpperCase()
    .trim();
}

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         g.*,
         latest_reservation.id AS reservation_id,
         latest_reservation.source AS reservation_source,
         latest_reservation.payment_method AS reservation_payment_method,
         latest_reservation.check_in AS reservation_check_in,
         latest_reservation.check_out AS reservation_check_out,
         latest_reservation.total_amount AS reservation_total_amount,
         COALESCE(sales_totals.paid_amount, 0)::numeric(12,2) AS reservation_paid_amount,
         GREATEST(latest_reservation.total_amount - COALESCE(sales_totals.paid_amount, 0), 0)::numeric(12,2) AS reservation_amount_due,
         CASE
           WHEN latest_reservation.id IS NULL THEN NULL
           WHEN COALESCE(sales_totals.paid_amount, 0) >= latest_reservation.total_amount THEN 'paid'
           WHEN COALESCE(sales_totals.paid_amount, 0) > 0 THEN 'partial'
           ELSE 'pending'
         END AS reservation_debt_status
       FROM guests g
       LEFT JOIN LATERAL (
         SELECT r.*
         FROM reservations r
         WHERE r.guest_id = g.id
         ORDER BY r.check_in DESC, r.id DESC
         LIMIT 1
       ) latest_reservation ON TRUE
       LEFT JOIN (
         SELECT reservation_id, SUM(amount) AS paid_amount
         FROM sales
         WHERE reservation_id IS NOT NULL
         GROUP BY reservation_id
       ) sales_totals ON sales_totals.reservation_id = latest_reservation.id
       ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/by-document/:documentId", async (req, res, next) => {
  try {
    const documentId = normalizeDocumentId(req.params.documentId);
    if (!documentId) return res.status(400).json({ error: "documentId invalido" });

    const result = await query(
      `SELECT *
       FROM guests
       WHERE translate(upper(coalesce(document_id, '')), '.- ', '') = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [documentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Huesped no encontrado para ese RUT" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { full_name, email = null, phone = null, document_id = null, notes = null } = req.body;
    if (!full_name) return res.status(400).json({ error: "full_name es requerido" });
    const normalizedDocumentId = document_id ? normalizeDocumentId(document_id) : null;

    const result = await query(
      `INSERT INTO guests (full_name, email, phone, document_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, email, phone, normalizedDocumentId, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id invalido" });
  }

  try {
    const result = await query("DELETE FROM guests WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Huesped no encontrado" });
    }
    return res.json({ ok: true, id });
  } catch (error) {
    if (error?.code === "23503") {
      return res.status(409).json({ error: "No se puede eliminar el huesped porque tiene reservas asociadas" });
    }
    return next(error);
  }
});

export default router;
