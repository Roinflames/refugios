import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, r.id AS reservation_code, s.id AS sale_code
       FROM documents d
       LEFT JOIN reservations r ON r.id = d.reservation_id
       LEFT JOIN sales s ON s.id = d.sale_id
       ORDER BY d.issue_date DESC, d.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      reservation_id = null,
      sale_id = null,
      document_type,
      document_number = null,
      issue_date,
      amount,
      status = "issued"
    } = req.body;

    if (!document_type || !issue_date || amount == null) {
      return res.status(400).json({ error: "document_type, issue_date y amount son requeridos" });
    }

    const result = await query(
      `INSERT INTO documents (reservation_id, sale_id, document_type, document_number, issue_date, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [reservation_id, sale_id, document_type, document_number, issue_date, amount, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
