import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

router.get("/summary", async (_req, res, next) => {
  try {
    const [sales, expenses, reservations, documentsByType, reservationsBySource] = await Promise.all([
      query("SELECT COALESCE(SUM(amount), 0) AS total_sales FROM sales"),
      query("SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses"),
      query("SELECT COUNT(*)::int AS total_reservations FROM reservations"),
      query(
        `SELECT document_type, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS total
         FROM documents
         GROUP BY document_type
         ORDER BY document_type`
      ),
      query(
        `SELECT source, COUNT(*)::int AS count, COALESCE(SUM(total_amount),0) AS total
         FROM reservations
         GROUP BY source
         ORDER BY count DESC`
      )
    ]);

    const totalSales = Number(sales.rows[0].total_sales);
    const totalExpenses = Number(expenses.rows[0].total_expenses);

    res.json({
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        profit: totalSales - totalExpenses,
        reservations: reservations.rows[0].total_reservations
      },
      documents: documentsByType.rows,
      reservationSources: reservationsBySource.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
