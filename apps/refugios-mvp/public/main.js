const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const UI_VERSION = "0.6.1";

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
  phone: "Teléfono",
  walkin: "Mostrador",
  other: "Otro"
};
const state = {
  periodFrom: "",
  periodTo: "",
  availabilityDate: new Date().toISOString().slice(0, 10),
  totalCabins: Number(localStorage.getItem("total_cabins") || 6)
};

function normalizeDocumentId(value) {
  return String(value || "")
    .replace(/[.\s-]/g, "")
    .toUpperCase()
    .trim();
}

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
  const navLinks = [...document.querySelectorAll(".quick-nav a")];
  const panels = [...document.querySelectorAll(".panel")];
  const toggle = document.getElementById("view-toggle");
  const STORAGE_KEY = "view_mode";
  const DEFAULT_PANEL = "#section-reservations";

  const setActivePanel = (id) => {
    panels.forEach((panel) => panel.classList.toggle("is-active", `#${panel.id}` === id));
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === id));
  };

  const applyMode = () => {
    const isSingle = localStorage.getItem(STORAGE_KEY) !== "all";
    if (isSingle) {
      document.body.classList.add("focus-mode");
      if (!document.querySelector(".panel.is-active")) setActivePanel(DEFAULT_PANEL);
      if (toggle) toggle.textContent = "Ver todo";
    } else {
      document.body.classList.remove("focus-mode");
      panels.forEach((panel) => panel.classList.add("is-active"));
      navLinks.forEach((link) => link.classList.remove("active"));
      if (toggle) toggle.textContent = "Ver por sección";
    }
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id) return;
      event.preventDefault();
      if (document.body.classList.contains("focus-mode")) {
        setActivePanel(id);
        return;
      }
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isSingle = document.body.classList.contains("focus-mode");
      localStorage.setItem(STORAGE_KEY, isSingle ? "all" : "single");
      applyMode();
    });
  }

  applyMode();
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  if (!document.querySelector(".form-modal:not([hidden])")) {
    document.body.classList.remove("modal-open");
  }
}

function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  const firstField = modal.querySelector("input, select, textarea, button");
  if (firstField) firstField.focus();
}

function setupSectionModals() {
  document.body.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-modal-open]");
    if (openButton) {
      const modalId = openButton.getAttribute("data-modal-open");
      if (!modalId) return;
      openModal(document.getElementById(modalId));
      return;
    }

    const closeButton = event.target.closest("[data-modal-close]");
    if (closeButton) {
      closeModal(closeButton.closest(".form-modal"));
      return;
    }

    if (event.target.classList.contains("form-modal")) {
      closeModal(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const opened = document.querySelector(".form-modal:not([hidden])");
    if (opened) closeModal(opened);
  });
}

function releaseCabinButton(reservationId) {
  return `<button type="button" class="btn-release-cabin" data-release-id="${reservationId}">Liberar cabaña</button>`;
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

function setReservationGuestStatus(message, type = "") {
  const status = document.getElementById("reservation-guest-status");
  if (!status) return;
  status.textContent = message;
  status.className = `form-helper ${type}`.trim();
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

function formatDate(value) {
  if (!value) return "-";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return value;
  return new Date(ts).toLocaleDateString("es-CL", { timeZone: "UTC" });
}

function toDateKey(value) {
  if (!value) return "";
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);
  const ts = Date.parse(String(value));
  if (!Number.isFinite(ts)) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

function inDateRange(value, from, to) {
  const rowDate = toDateKey(value);
  const fromDate = toDateKey(from);
  const toDate = toDateKey(to);
  if (!rowDate) return false;
  if (fromDate && rowDate < fromDate) return false;
  if (toDate && rowDate > toDate) return false;
  return true;
}

function filterRows(rows, dateField) {
  if (!state.periodFrom && !state.periodTo) return rows;
  return rows.filter((row) => inDateRange(row[dateField], state.periodFrom, state.periodTo));
}

function updatePeriodLabel() {
  const label = document.getElementById("current-period");
  if (!label) return;
  if (!state.periodFrom && !state.periodTo) {
    label.textContent = "Período: Histórico acumulado";
    return;
  }
  const fromText = state.periodFrom ? formatDate(state.periodFrom) : "inicio";
  const toText = state.periodTo ? formatDate(state.periodTo) : "hoy";
  label.textContent = `Período: ${fromText} - ${toText}`;
}

function renderSummary({ sales, expenses, reservations }) {
  const totalSales = sales.reduce((acc, row) => acc + Number(row.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, row) => acc + Number(row.amount || 0), 0);
  const profit = totalSales - totalExpenses;

  const cards = [
    ["Ventas", money.format(totalSales)],
    ["Gastos", money.format(totalExpenses)],
    ["Utilidad", money.format(profit)],
    ["Reservas", String(reservations.length)]
  ];

  document.getElementById("summary").innerHTML = cards
    .map(([label, value]) => `<div class="card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function isReservationActiveOnDate(reservation, day) {
  const targetDay = toDateKey(day);
  const checkIn = toDateKey(reservation?.check_in);
  const checkOut = toDateKey(reservation?.check_out);
  if (!targetDay || !checkIn || !checkOut) return false;
  if (reservation.status === "cancelled") return false;
  return checkIn <= targetDay && targetDay < checkOut;
}

function renderAvailability(reservations) {
  const total = Math.max(1, Number(state.totalCabins || 1));
  const active = reservations.filter((row) => isReservationActiveOnDate(row, state.availabilityDate));
  const occupied = Math.min(active.length, total);
  const free = Math.max(total - occupied, 0);
  const occupancyPct = Math.round((occupied / total) * 100);

  const totalEl = document.getElementById("cabins-total");
  const occupiedEl = document.getElementById("cabins-occupied");
  const freeEl = document.getElementById("cabins-free");
  const occupancyEl = document.getElementById("cabins-occupancy");
  if (totalEl) totalEl.textContent = String(total);
  if (occupiedEl) occupiedEl.textContent = String(occupied);
  if (freeEl) freeEl.textContent = String(free);
  if (occupancyEl) occupancyEl.textContent = `${occupancyPct}%`;

  const grid = document.getElementById("availability-grid");
  if (grid) {
    const houses = Array.from({ length: total }, (_, index) => index < occupied);
    grid.innerHTML = houses
      .map(
        (isOccupied, index) => `<li class="availability-house ${isOccupied ? "is-occupied" : "is-free"}">
          <span class="house-icon">${isOccupied ? "🏠" : "🏡"}</span>
          <span class="house-name">Cabaña ${index + 1}</span>
        </li>`
      )
      .join("");
  }

  const list = document.getElementById("availability-reservations");
  if (list) {
    if (active.length === 0) {
      list.innerHTML = `<li class="availability-reservation-empty">Sin reservas activas para ${formatDate(state.availabilityDate)}.</li>`;
    } else {
      const rows = active
        .slice(0, total)
        .map(
          (row, index) => `<li class="record-item">
            <div class="record-main">
              <span class="record-title">Cabaña ${index + 1} · ${row.guest_name}</span>
              <span class="record-id">#${row.id}</span>
            </div>
            <div class="record-meta">
              ${chip(`Check-in ${formatDate(row.check_in)}`)}
              ${chip(`Check-out ${formatDate(row.check_out)}`)}
              ${chip(`Canal ${sourceLabels[row.source] || row.source}`)}
              ${chip(`Estado ${row.status}`)}
            </div>
            <div class="record-actions">${releaseCabinButton(row.id)}</div>
          </li>`
        )
        .join("");
      list.innerHTML = rows;
    }
  }
}

function bindAvailabilityActions() {
  document.body.addEventListener("click", async (event) => {
    const releaseButton = event.target.closest(".btn-release-cabin");
    if (!releaseButton) return;

    const id = Number(releaseButton.dataset.releaseId);
    if (!Number.isInteger(id) || id <= 0) return;

    const confirmed = window.confirm(`Liberar cabaña de la reserva #${id}?`);
    if (!confirmed) return;

    setStatus("Liberando cabaña...");
    try {
      await api(`/api/reservations/${id}/release`, { method: "PATCH" });
      await loadAll();
      setStatus(`Cabaña liberada (reserva #${id})`, "ok");
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  });
}

function setupAvailabilityControls() {
  const dateInput = document.getElementById("availability-date");
  const dec = document.getElementById("cabins-dec");
  const inc = document.getElementById("cabins-inc");

  if (dateInput) {
    dateInput.value = state.availabilityDate;
    dateInput.addEventListener("change", async () => {
      state.availabilityDate = dateInput.value || new Date().toISOString().slice(0, 10);
      await loadAll();
      setStatus(`Disponibilidad actualizada para ${formatDate(state.availabilityDate)}`, "ok");
    });
  }

  if (dec) {
    dec.addEventListener("click", async () => {
      state.totalCabins = Math.max(1, Number(state.totalCabins) - 1);
      localStorage.setItem("total_cabins", String(state.totalCabins));
      await loadAll();
    });
  }

  if (inc) {
    inc.addEventListener("click", async () => {
      state.totalCabins = Math.min(40, Number(state.totalCabins) + 1);
      localStorage.setItem("total_cabins", String(state.totalCabins));
      await loadAll();
    });
  }
}

async function loadAll() {
  const [guests, reservations, sales, expenses, documents] = await Promise.all([
    api("/api/guests"),
    api("/api/reservations"),
    api("/api/sales"),
    api("/api/expenses"),
    api("/api/documents")
  ]);

  const filteredReservations = filterRows(reservations, "check_in");
  const filteredSales = filterRows(sales, "sale_date");
  const filteredExpenses = filterRows(expenses, "expense_date");
  const filteredDocuments = filterRows(documents, "issue_date");
  const filteredGuests = state.periodFrom || state.periodTo
    ? guests.filter((row) => inDateRange(row.reservation_check_in, state.periodFrom, state.periodTo))
    : guests;

  renderSummary({
    sales: filteredSales,
    expenses: filteredExpenses,
    reservations: filteredReservations
  });
  renderAvailability(reservations);

  const orderedGuests = [...filteredGuests].sort((a, b) => {
    const debtDiff = debtPriority(a.reservation_debt_status) - debtPriority(b.reservation_debt_status);
    if (debtDiff !== 0) return debtDiff;
    return dateWeight(b.reservation_check_in) - dateWeight(a.reservation_check_in);
  });

  const orderedReservations = [...filteredReservations].sort((a, b) => {
    const debtDiff = debtPriority(a.debt_status) - debtPriority(b.debt_status);
    if (debtDiff !== 0) return debtDiff;
    return dateWeight(a.check_in) - dateWeight(b.check_in);
  });

  const orderedSales = [...filteredSales].sort((a, b) => dateWeight(b.sale_date) - dateWeight(a.sale_date));
  const orderedExpenses = [...filteredExpenses].sort((a, b) => dateWeight(b.expense_date) - dateWeight(a.expense_date));
  const orderedDocuments = [...filteredDocuments].sort((a, b) => dateWeight(b.issue_date) - dateWeight(a.issue_date));

  renderList("guests-list", orderedGuests, (row) => {
    const hasReservation = Boolean(row.reservation_id);
    const meta = hasReservation
      ? [
          chip(`Canal ${sourceLabels[row.reservation_source] || row.reservation_source}`),
          chip(`Llega ${formatDate(row.reservation_check_in)}`),
          chip(`Sale ${formatDate(row.reservation_check_out)}`),
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
        ${chip(`Llega ${formatDate(row.check_in)}`)}
        ${chip(`Sale ${formatDate(row.check_out)}`)}
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
        ${chip(`Fecha ${formatDate(row.sale_date)}`)}
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
        ${chip(`Fecha ${formatDate(row.expense_date)}`)}
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
        ${chip(`Fecha ${formatDate(row.issue_date)}`)}
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
      closeModal(form.closest(".form-modal"));
      setStatus(successMessage, "ok");
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  });
}

async function lookupGuestByDocument(documentId) {
  return api(`/api/guests/by-document/${encodeURIComponent(documentId)}`);
}

function bindReservationGuestLookup() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  const documentInput = form.querySelector('input[name="guest_document_id"]');
  const guestNameInput = form.querySelector('input[name="guest_full_name"]');
  const guestIdInput = form.querySelector('input[name="guest_id"]');
  if (!documentInput || !guestIdInput || !guestNameInput) return;

  const clearGuest = () => {
    guestIdInput.value = "";
    setReservationGuestStatus("Ingresa RUT para buscar huésped.");
  };

  let lookupSeq = 0;
  const runLookup = async () => {
    const rut = normalizeDocumentId(documentInput.value);
    documentInput.value = rut;
    if (!rut) {
      clearGuest();
      return;
    }

    const seq = ++lookupSeq;
    setReservationGuestStatus("Buscando huésped por RUT...");
    try {
      const guest = await lookupGuestByDocument(rut);
      if (seq !== lookupSeq) return;
      guestIdInput.value = String(guest.id);
      if (!guestNameInput.value) guestNameInput.value = guest.full_name || "";
      setReservationGuestStatus(`Huésped encontrado: ${guest.full_name} (#${guest.id})`, "ok");
    } catch (error) {
      if (seq !== lookupSeq) return;
      guestIdInput.value = "";
      if (error.message?.includes("no encontrado")) {
        setReservationGuestStatus("RUT no registrado. Escribe nombre para crearlo al guardar.", "error");
        return;
      }
      setReservationGuestStatus(`No se pudo buscar huésped: ${error.message}`, "error");
    }
  };

  documentInput.addEventListener("blur", runLookup);
  documentInput.addEventListener("change", runLookup);
  documentInput.addEventListener("input", () => {
    guestIdInput.value = "";
    setReservationGuestStatus("Ingresa RUT para buscar huésped.");
  });
}

function bindReservationForm() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = normalize(toPayload(form));
    const rut = normalizeDocumentId(payload.guest_document_id);
    payload.guest_document_id = rut;

    if (!rut) {
      setStatus("Debes ingresar RUT del huésped", "error");
      setReservationGuestStatus("Debes ingresar RUT válido.", "error");
      return;
    }

    setStatus("Guardando...", "");
    try {
      let guestId = Number(payload.guest_id);
      if (!Number.isInteger(guestId) || guestId <= 0) {
        if (!payload.guest_full_name) {
          throw new Error("RUT no encontrado. Ingresa nombre para crear huésped.");
        }
        const createdGuest = await api("/api/guests", {
          method: "POST",
          body: JSON.stringify({
            full_name: payload.guest_full_name,
            document_id: rut
          })
        });
        guestId = Number(createdGuest.id);
      }

      const reservationPayload = {
        guest_id: guestId,
        source: payload.source,
        payment_method: payload.payment_method,
        check_in: payload.check_in,
        check_out: payload.check_out,
        guests_count: payload.guests_count,
        total_amount: payload.total_amount
      };

      await api("/api/reservations", { method: "POST", body: JSON.stringify(reservationPayload) });
      form.reset();
      setReservationGuestStatus("Ingresa RUT para buscar huésped.");
      await loadAll();
      closeModal(form.closest(".form-modal"));
      setStatus("Reserva guardada", "ok");
    } catch (error) {
      setStatus(error.message, "error");
      setReservationGuestStatus(error.message, "error");
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

function bindPeriodControls() {
  const from = document.getElementById("period-from");
  const to = document.getElementById("period-to");
  const apply = document.getElementById("period-apply");
  const clear = document.getElementById("period-clear");
  if (!from || !to || !apply || !clear) return;

  apply.addEventListener("click", async () => {
    try {
      state.periodFrom = from.value || "";
      state.periodTo = to.value || "";
      if (state.periodFrom && state.periodTo && state.periodFrom > state.periodTo) {
        setStatus("Rango inválido: 'desde' no puede ser mayor que 'hasta'", "error");
        return;
      }
      updatePeriodLabel();
      setStatus("Aplicando período...");
      await loadAll();
      setStatus("Período aplicado", "ok");
    } catch (error) {
      setStatus(`No se pudo aplicar período: ${error.message}`, "error");
    }
  });

  clear.addEventListener("click", async () => {
    try {
      from.value = "";
      to.value = "";
      state.periodFrom = "";
      state.periodTo = "";
      updatePeriodLabel();
      setStatus("Mostrando histórico...");
      await loadAll();
      setStatus("Filtro limpiado", "ok");
    } catch (error) {
      setStatus(`No se pudo limpiar período: ${error.message}`, "error");
    }
  });
}

for (const [formId, endpoint, message] of [
  ["guest-form", "/api/guests", "Huesped guardado"],
  ["sale-form", "/api/sales", "Venta registrada"],
  ["expense-form", "/api/expenses", "Gasto registrado"],
  ["document-form", "/api/documents", "Documento registrado"]
]) {
  bindForm(formId, endpoint, message);
}

bindReservationGuestLookup();
bindReservationForm();
bindDeleteButtons();
bindPeriodControls();
bindAvailabilityActions();
setupAvailabilityControls();
setupSectionModals();
setupThemeToggle();
setUiVersion();
setupFocusMode();
updatePeriodLabel();

setStatus("Cargando panel...");
loadAll()
  .then(() => {
    const stamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setStatus(`Panel actualizado ${stamp}`, "ok");
  })
  .catch((error) => {
    console.error(error);
    const message = `No se pudo cargar el panel: ${error.message}`;
    setStatus(message, "error");
    alert(message);
  });
