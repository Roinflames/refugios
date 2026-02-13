const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const UI_VERSION = "0.5.0";

const paymentLabels = {
  transfer: "Transferencia",
  card: "Tarjeta",
  cash: "Efectivo",
  mercadopago: "MercadoPago",
  other: "Otro"
};

const sourceLabels = {
  web: "Web",
  airbnb: "Airbnb",
  booking: "Booking",
  phone: "Telefono",
  walkin: "Mostrador",
  other: "Otro"
};

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  const button = document.getElementById("theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "Tema claro" : "Tema oscuro";
  }
}

function setupThemeToggle() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  const button = document.getElementById("theme-toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function setUiVersion() {
  const el = document.getElementById("ui-version");
  if (el) el.textContent = `UI v${UI_VERSION}`;
}

function setupFocusMode() {
  const mq = window.matchMedia("(max-width: 739px)");
  const navLinks = [...document.querySelectorAll(".quick-nav a")];
  const panels = [...document.querySelectorAll(".panel")];
  const toggle = document.getElementById("view-toggle");

  const setActivePanel = (id) => {
    panels.forEach((panel) => panel.classList.toggle("is-active", `#${panel.id}` === id));
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === id));
  };

  const applyMode = () => {
    const isFocus = localStorage.getItem("focus_mode") !== "all";
    if (mq.matches && isFocus) {
      document.body.classList.add("focus-mode");
      if (!document.querySelector(".panel.is-active")) setActivePanel("#section-reservations");
      if (toggle) toggle.textContent = "Ver todo";
    } else {
      document.body.classList.remove("focus-mode");
      panels.forEach((panel) => panel.classList.add("is-active"));
      navLinks.forEach((link) => link.classList.remove("active"));
      if (toggle) toggle.textContent = "Modo enfoque";
    }
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id) return;
      if (document.body.classList.contains("focus-mode")) {
        event.preventDefault();
        setActivePanel(id);
      }
    });
  });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isFocus = document.body.classList.contains("focus-mode");
      localStorage.setItem("focus_mode", isFocus ? "all" : "focus");
      applyMode();
    });
  }

  mq.addEventListener("change", applyMode);
  applyMode();
}

function toPayload(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function normalize(body) {
  const output = { ...body };

  for (const key of ["guest_id", "reservation_id", "sale_id", "guests_count"]) {
    if (output[key] === "") delete output[key];
    else if (output[key] != null) output[key] = Number(output[key]);
  }

  for (const key of ["amount", "total_amount"]) {
    if (output[key] != null) output[key] = Number(output[key]);
  }

  return output;
}

function setStatus(message, type = "") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`.trim();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Error ${response.status}`);
  }

  return response.json();
}

function renderList(id, rows, formatter) {
  const container = document.getElementById(id);
  container.innerHTML = rows.map(formatter).join("");
}

function debtLabel(status, amountDue) {
  if (status === "paid") return "No debe";
  if (status === "partial") return `Debe ${money.format(amountDue || 0)}`;
  if (status === "pending") return `Debe ${money.format(amountDue || 0)}`;
  return "Sin estado";
}

function debtClass(status) {
  if (status === "paid") return "debt-paid";
  if (status === "partial") return "debt-partial";
  if (status === "pending") return "debt-pending";
  return "";
}

function chip(label, className = "") {
  return `<span class="chip ${className}">${label}</span>`;
}

function deleteButton(type, id) {
  return `<button type="button" class="btn-delete" data-delete-type="${type}" data-id="${id}">Eliminar</button>`;
}

function debtPriority(status) {
  if (status === "pending") return 0;
  if (status === "partial") return 1;
  if (status === "paid") return 2;
  return 3;
}

function dateWeight(value) {
  const ts = Date.parse(value || "");
  return Number.isFinite(ts) ? ts : 0;
}

async function loadSummary() {
  const data = await api("/api/dashboard/summary");
  const cards = [
    ["Ventas", money.format(data.totals.sales)],
    ["Gastos", money.format(data.totals.expenses)],
    ["Utilidad", money.format(data.totals.profit)],
    ["Reservas", String(data.totals.reservations)]
  ];

  document.getElementById("summary").innerHTML = cards
    .map(([label, value]) => `<div class="card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

async function loadAll() {
  await loadSummary();

  const [guests, reservations, sales, expenses, documents] = await Promise.all([
    api("/api/guests"),
    api("/api/reservations"),
    api("/api/sales"),
    api("/api/expenses"),
    api("/api/documents")
  ]);

  const orderedGuests = [...guests].sort((a, b) => {
    const debtDiff = debtPriority(a.reservation_debt_status) - debtPriority(b.reservation_debt_status);
    if (debtDiff !== 0) return debtDiff;
    return dateWeight(b.reservation_check_in) - dateWeight(a.reservation_check_in);
  });

  const orderedReservations = [...reservations].sort((a, b) => {
    const debtDiff = debtPriority(a.debt_status) - debtPriority(b.debt_status);
    if (debtDiff !== 0) return debtDiff;
    return dateWeight(a.check_in) - dateWeight(b.check_in);
  });

  const orderedSales = [...sales].sort((a, b) => dateWeight(b.sale_date) - dateWeight(a.sale_date));
  const orderedExpenses = [...expenses].sort((a, b) => dateWeight(b.expense_date) - dateWeight(a.expense_date));
  const orderedDocuments = [...documents].sort((a, b) => dateWeight(b.issue_date) - dateWeight(a.issue_date));

  renderList("guests-list", orderedGuests, (row) => {
    const hasReservation = Boolean(row.reservation_id);
    const meta = hasReservation
      ? [
          chip(`Canal ${sourceLabels[row.reservation_source] || row.reservation_source}`),
          chip(`Llega ${row.reservation_check_in}`),
          chip(`Sale ${row.reservation_check_out}`),
          chip(`Pago ${paymentLabels[row.reservation_payment_method] || row.reservation_payment_method}`),
          chip(debtLabel(row.reservation_debt_status, row.reservation_amount_due), debtClass(row.reservation_debt_status))
        ].join("")
      : chip("Sin reservas asociadas");

    return `<li class="record-item">
      <div class="record-main">
        <span class="record-title">${row.full_name}</span>
        <span class="record-id">#${row.id}</span>
      </div>
      <div class="record-meta">${meta}</div>
      <div class="record-actions">${deleteButton("guests", row.id)}</div>
    </li>`;
  });

  renderList("reservations-list", orderedReservations, (row) => `<li class="record-item">
      <div class="record-main">
        <span class="record-title">${row.guest_name}</span>
        <span class="record-id">#${row.id}</span>
      </div>
      <div class="record-meta">
        ${chip(`Canal ${sourceLabels[row.source] || row.source}`)}
        ${chip(`Llega ${row.check_in}`)}
        ${chip(`Sale ${row.check_out}`)}
        ${chip(`Pago ${paymentLabels[row.payment_method] || row.payment_method}`)}
        ${chip(`Total ${money.format(row.total_amount)}`)}
        ${chip(`Abonado ${money.format(row.paid_amount || 0)}`)}
        ${chip(debtLabel(row.debt_status, row.amount_due), debtClass(row.debt_status))}
      </div>
      <div class="record-actions">${deleteButton("reservations", row.id)}</div>
    </li>`);

  renderList("sales-list", orderedSales, (row) => `<li class="record-item">
      <div class="record-main">
        <span class="record-title">${row.category}</span>
        <span class="record-id">#${row.id}</span>
      </div>
      <div class="record-meta">
        ${chip(`Fecha ${row.sale_date}`)}
        ${chip(`Pago ${paymentLabels[row.payment_method] || row.payment_method}`)}
        ${chip(`Monto ${money.format(row.amount)}`)}
      </div>
      <div class="record-actions">${deleteButton("sales", row.id)}</div>
    </li>`);

  renderList("expenses-list", orderedExpenses, (row) => `<li class="record-item">
      <div class="record-main">
        <span class="record-title">${row.category}</span>
        <span class="record-id">#${row.id}</span>
      </div>
      <div class="record-meta">
        ${chip(`Fecha ${row.expense_date}`)}
        ${chip(`Pago ${paymentLabels[row.payment_method] || row.payment_method}`)}
        ${chip(`Monto ${money.format(row.amount)}`)}
      </div>
      <div class="record-actions">${deleteButton("expenses", row.id)}</div>
    </li>`);

  renderList("documents-list", orderedDocuments, (row) => `<li class="record-item">
      <div class="record-main">
        <span class="record-title">${row.document_type.toUpperCase()} ${row.document_number || "S/N"}</span>
        <span class="record-id">#${row.id}</span>
      </div>
      <div class="record-meta">
        ${chip(`Fecha ${row.issue_date}`)}
        ${chip(`Monto ${money.format(row.amount)}`)}
        ${row.reservation_id ? chip(`Reserva #${row.reservation_id}`) : ""}
        ${row.sale_id ? chip(`Venta #${row.sale_id}`) : ""}
      </div>
      <div class="record-actions">${deleteButton("documents", row.id)}</div>
    </li>`);
}

function bindForm(id, endpoint, successMessage) {
  const form = document.getElementById(id);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = normalize(toPayload(form));

    setStatus("Guardando...", "");

    try {
      await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      await loadAll();
      setStatus(successMessage, "ok");
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  });
}

function bindDeleteButtons() {
  document.body.addEventListener("click", async (event) => {
    const button = event.target.closest(".btn-delete");
    if (!button) return;

    const { deleteType, id } = button.dataset;
    if (!deleteType || !id) return;

    const confirmed = window.confirm(`Eliminar registro #${id}? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setStatus("Eliminando...", "");

    try {
      await api(`/api/${deleteType}/${id}`, { method: "DELETE" });
      await loadAll();
      setStatus(`Registro #${id} eliminado`, "ok");
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  });
}

for (const [formId, endpoint, message] of [
  ["guest-form", "/api/guests", "Huesped guardado"],
  ["reservation-form", "/api/reservations", "Reserva guardada"],
  ["sale-form", "/api/sales", "Venta registrada"],
  ["expense-form", "/api/expenses", "Gasto registrado"],
  ["document-form", "/api/documents", "Documento registrado"]
]) {
  bindForm(formId, endpoint, message);
}

bindDeleteButtons();
setupThemeToggle();
setUiVersion();
setupFocusMode();

setStatus("Cargando panel...");
loadAll()
  .then(() => setStatus("Panel actualizado", "ok"))
  .catch((error) => {
    console.error(error);
    const message = `No se pudo cargar el panel: ${error.message}`;
    setStatus(message, "error");
    alert(message);
  });
