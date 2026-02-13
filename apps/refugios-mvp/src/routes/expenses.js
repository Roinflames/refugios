import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM expenses ORDER BY expense_date DESC, id DESC");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      category,
      amount,
      payment_method,
      expense_date,
      supplier = null,
      description = null
    } = req.body;

    if (!category || amount == null || !payment_method || !expense_date) {
      return res.status(400).json({ error: "category, amount, payment_method y expense_date son requeridos" });
    }

    const result = await query(
      `INSERT INTO expenses (category, amount, payment_method, expense_date, supplier, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [category, amount, payment_method, expense_date, supplier, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
