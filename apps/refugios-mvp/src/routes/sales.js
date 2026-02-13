import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM sales ORDER BY sale_date DESC, id DESC");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { reservation_id = null, category = "lodging", amount, payment_method, sale_date, description = null } = req.body;
    if (amount == null || !payment_method || !sale_date) {
      return res.status(400).json({ error: "amount, payment_method y sale_date son requeridos" });
    }

    const result = await query(
      `INSERT INTO sales (reservation_id, category, amount, payment_method, sale_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [reservation_id, category, amount, payment_method, sale_date, description]
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
    const result = await query("DELETE FROM sales WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }
    return res.json({ ok: true, id });
  } catch (error) {
    return next(error);
  }
});

export default router;
