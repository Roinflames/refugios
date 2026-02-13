import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM app_users
       ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
