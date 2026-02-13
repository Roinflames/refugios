import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, g.full_name AS guest_name
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
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

    const result = await query(
      `INSERT INTO reservations (guest_id, source, payment_method, status, check_in, check_out, guests_count, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [guest_id, source, payment_method, status, check_in, check_out, guests_count, total_amount, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
