import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         r.*,
         g.full_name AS guest_name,
         COALESCE(sales_totals.paid_amount, 0)::numeric(12,2) AS paid_amount,
         GREATEST(r.total_amount - COALESCE(sales_totals.paid_amount, 0), 0)::numeric(12,2) AS amount_due,
         CASE
           WHEN COALESCE(sales_totals.paid_amount, 0) >= r.total_amount THEN 'paid'
           WHEN COALESCE(sales_totals.paid_amount, 0) > 0 THEN 'partial'
           ELSE 'pending'
         END AS debt_status
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN (
         SELECT reservation_id, SUM(amount) AS paid_amount
         FROM sales
         WHERE reservation_id IS NOT NULL
         GROUP BY reservation_id
       ) sales_totals ON sales_totals.reservation_id = r.id
       ORDER BY r.check_in DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      guest_id,
      source,
      payment_method,
      status = "confirmed",
      check_in,
      check_out,
      guests_count = 1,
      total_amount,
      notes = null
    } = req.body;

    if (!guest_id || !source || !payment_method || !check_in || !check_out || total_amount == null) {
      return res.status(400).json({ error: "Campos requeridos faltantes" });
    }

    const parsedGuestId = Number(guest_id);
    const parsedGuestsCount = Number(guests_count);
    const parsedTotalAmount = Number(total_amount);

    if (!Number.isInteger(parsedGuestId) || parsedGuestId <= 0) {
      return res.status(400).json({ error: "guest_id invalido" });
    }
    if (!Number.isInteger(parsedGuestsCount) || parsedGuestsCount <= 0) {
      return res.status(400).json({ error: "guests_count invalido" });
    }
    if (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount < 0) {
      return res.status(400).json({ error: "total_amount invalido" });
    }
    if (check_in >= check_out) {
      return res.status(400).json({ error: "check_out debe ser posterior a check_in" });
    }

    const overlap = await query(
      `SELECT id
       FROM reservations
       WHERE guest_id = $1
         AND status IN ('pending', 'confirmed')
         AND daterange(check_in, check_out, '[)') && daterange($2::date, $3::date, '[)')
       LIMIT 1`,
      [parsedGuestId, check_in, check_out]
    );
    if (overlap.rowCount > 0) {
      return res.status(409).json({ error: "Ya existe una reserva activa de este huésped en ese período" });
    }

    const result = await query(
      `INSERT INTO reservations (guest_id, source, payment_method, status, check_in, check_out, guests_count, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [parsedGuestId, source, payment_method, status, check_in, check_out, parsedGuestsCount, parsedTotalAmount, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/release", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id invalido" });
  }

  try {
    const result = await query(
      `UPDATE reservations
       SET
         status = 'completed',
         check_out = CURRENT_DATE
       WHERE id = $1
         AND status IN ('pending', 'confirmed')
       RETURNING id, guest_id, check_in, check_out, status`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reserva activa no encontrada para liberar" });
    }

    return res.json({ ok: true, reservation: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id invalido" });
  }

  try {
    const result = await query("DELETE FROM reservations WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    return res.json({ ok: true, id });
  } catch (error) {
    return next(error);
  }
});

export default router;
