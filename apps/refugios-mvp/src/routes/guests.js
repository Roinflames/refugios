import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM guests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { full_name, email = null, phone = null, document_id = null, notes = null } = req.body;
    if (!full_name) return res.status(400).json({ error: "full_name es requerido" });

    const result = await query(
      `INSERT INTO guests (full_name, email, phone, document_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, email, phone, document_id, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
