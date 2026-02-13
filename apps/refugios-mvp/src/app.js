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
  if (error?.code === "MISSING_DATABASE_URL") {
    return res.status(503).json({ error: "Servicio no configurado: falta DATABASE_URL" });
  }
  if (error?.code === "42P01") {
    return res.status(503).json({ error: "Base de datos sin migrar. Ejecuta db:migrate." });
  }
  if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"].includes(error?.code)) {
    return res.status(503).json({ error: "No se pudo conectar a la base de datos." });
  }
  if (error?.code === "28P01") {
    return res.status(503).json({ error: "Credenciales de base de datos invalidas." });
  }
  if (error?.code === "23503") {
    return res.status(400).json({ error: "Referencia invalida: verifica huésped, reserva o venta relacionada." });
  }
  if (error?.code === "23514") {
    return res.status(400).json({ error: "Dato fuera de catálogo permitido (canal, estado, documento o forma de pago)." });
  }
  if (error?.code === "22P02") {
    return res.status(400).json({ error: "Formato de dato invalido en la solicitud." });
  }
  if (error?.code === "23502") {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }
  res.status(500).json({ error: "Error interno del servidor" });
});

export default app;
