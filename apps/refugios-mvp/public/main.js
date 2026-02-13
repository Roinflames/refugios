const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

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

  renderList("guests-list", guests, (row) => `<li>#${row.id} ${row.full_name} ${row.phone ? `- ${row.phone}` : ""}</li>`);
  renderList(
    "reservations-list",
    reservations,
    (row) => `<li>#${row.id} ${row.guest_name} | ${row.source} | ${row.check_in} a ${row.check_out} | ${money.format(row.total_amount)}</li>`
  );
  renderList("sales-list", sales, (row) => `<li>#${row.id} ${row.sale_date} | ${row.category} | ${money.format(row.amount)}</li>`);
  renderList("expenses-list", expenses, (row) => `<li>#${row.id} ${row.expense_date} | ${row.category} | ${money.format(row.amount)}</li>`);
  renderList(
    "documents-list",
    documents,
    (row) => `<li>#${row.id} ${row.document_type.toUpperCase()} ${row.document_number || "s/n"} | ${row.issue_date} | ${money.format(row.amount)}</li>`
  );
}

function bindForm(id, endpoint) {
  const form = document.getElementById(id);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = normalize(toPayload(form));

    try {
      await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      await loadAll();
    } catch (error) {
      alert(error.message);
    }
  });
}

for (const [formId, endpoint] of [
  ["guest-form", "/api/guests"],
  ["reservation-form", "/api/reservations"],
  ["sale-form", "/api/sales"],
  ["expense-form", "/api/expenses"],
  ["document-form", "/api/documents"]
]) {
  bindForm(formId, endpoint);
}

loadAll().catch((error) => {
  console.error(error);
  alert("No se pudo cargar el panel. Revisa DATABASE_URL y migraciones.");
});
