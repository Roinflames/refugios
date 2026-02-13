import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import usersRouter from "./routes/users.js";
import guestsRouter from "./routes/guests.js";
import reservationsRouter from "./routes/reservations.js";
import salesRouter from "./routes/sales.js";
import expensesRouter from "./routes/expenses.js";
import documentsRouter from "./routes/documents.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "refugios-mvp", ts: new Date().toISOString() });
});

app.use("/api/users", usersRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
});

export default app;
