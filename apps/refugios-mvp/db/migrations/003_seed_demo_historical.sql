-- Seed demo historico 2024-2026 para pruebas de ocupacion y comparativos.
-- Idempotente: usa claves de control en notes/description para no duplicar.

WITH demo_names AS (
  SELECT * FROM (VALUES
    ('Demo Huesped 01'), ('Demo Huesped 02'), ('Demo Huesped 03'), ('Demo Huesped 04'),
    ('Demo Huesped 05'), ('Demo Huesped 06'), ('Demo Huesped 07'), ('Demo Huesped 08'),
    ('Demo Huesped 09'), ('Demo Huesped 10'), ('Demo Huesped 11'), ('Demo Huesped 12'),
    ('Demo Huesped 13'), ('Demo Huesped 14'), ('Demo Huesped 15'), ('Demo Huesped 16'),
    ('Demo Huesped 17'), ('Demo Huesped 18'), ('Demo Huesped 19'), ('Demo Huesped 20'),
    ('Demo Huesped 21'), ('Demo Huesped 22'), ('Demo Huesped 23'), ('Demo Huesped 24'),
    ('Demo Huesped 25'), ('Demo Huesped 26'), ('Demo Huesped 27'), ('Demo Huesped 28'),
    ('Demo Huesped 29'), ('Demo Huesped 30'), ('Demo Huesped 31'), ('Demo Huesped 32'),
    ('Demo Huesped 33'), ('Demo Huesped 34'), ('Demo Huesped 35'), ('Demo Huesped 36')
  ) AS t(full_name)
),
demo_names_numbered AS (
  SELECT
    full_name,
    ROW_NUMBER() OVER (ORDER BY full_name) AS rn
  FROM demo_names
)
INSERT INTO guests (full_name, email, phone, document_id, notes)
SELECT
  n.full_name,
  NULL,
  NULL,
  'DEMO-HIST-' || LPAD(n.rn::text, 3, '0'),
  'seed_demo_historical'
FROM demo_names_numbered n
WHERE NOT EXISTS (
  SELECT 1
  FROM guests g
  WHERE g.document_id = 'DEMO-HIST-' || LPAD(n.rn::text, 3, '0')
);

WITH demo_guest_map AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM guests
  WHERE document_id LIKE 'DEMO-HIST-%'
),
weeks AS (
  SELECT generate_series(date '2024-01-01', date '2026-12-22', interval '7 day')::date AS week_start
),
weekly_slots AS (
  SELECT
    w.week_start,
    EXTRACT(YEAR FROM w.week_start)::int AS yy,
    EXTRACT(WEEK FROM w.week_start)::int AS ww,
    s.slot
  FROM weeks w
  CROSS JOIN LATERAL generate_series(
    1,
    CASE
      WHEN EXTRACT(YEAR FROM w.week_start) = 2024 THEN 6
      WHEN EXTRACT(YEAR FROM w.week_start) = 2025 THEN 8
      ELSE 9
    END
  ) AS s(slot)
),
generated_reservations AS (
  SELECT
    gm.id AS guest_id,
    CASE (ws.slot % 6)
      WHEN 0 THEN 'web'
      WHEN 1 THEN 'airbnb'
      WHEN 2 THEN 'booking'
      WHEN 3 THEN 'phone'
      WHEN 4 THEN 'walkin'
      ELSE 'other'
    END AS source,
    CASE (ws.slot % 5)
      WHEN 0 THEN 'transfer'
      WHEN 1 THEN 'card'
      WHEN 2 THEN 'cash'
      WHEN 3 THEN 'mercadopago'
      ELSE 'other'
    END AS payment_method,
    CASE
      WHEN ws.week_start + (((ws.slot + ws.ww) % 4) + 2) < CURRENT_DATE THEN 'completed'
      ELSE 'confirmed'
    END AS status,
    (ws.week_start + ((ws.slot - 1) % 3))::date AS check_in,
    (ws.week_start + ((ws.slot - 1) % 3) + (((ws.slot + ws.ww) % 4) + 2))::date AS check_out,
    ((ws.slot % 4) + 1) AS guests_count,
    (
      95000
      + ((ws.slot % 4) * 22000)
      + CASE
          WHEN ws.yy = 2024 THEN 0
          WHEN ws.yy = 2025 THEN 18000
          ELSE 26000
        END
    )::numeric(12,2) AS total_amount,
    ('DEMO_HIST_RES|' || ws.yy || '|' || ws.week_start || '|' || ws.slot) AS notes
  FROM weekly_slots ws
  JOIN demo_guest_map gm
    ON gm.rn = (((ws.yy * 100 + ws.ww + ws.slot) % 36) + 1)
)
INSERT INTO reservations (
  guest_id,
  source,
  payment_method,
  status,
  check_in,
  check_out,
  guests_count,
  total_amount,
  notes
)
SELECT
  gr.guest_id,
  gr.source,
  gr.payment_method,
  gr.status,
  gr.check_in,
  gr.check_out,
  gr.guests_count,
  gr.total_amount,
  gr.notes
FROM generated_reservations gr
WHERE NOT EXISTS (
  SELECT 1
  FROM reservations r
  WHERE r.notes = gr.notes
);

WITH demo_reservations AS (
  SELECT id, total_amount, check_in, status, notes
  FROM reservations
  WHERE notes LIKE 'DEMO_HIST_RES|%'
)
INSERT INTO sales (reservation_id, category, amount, payment_method, sale_date, description)
SELECT
  r.id,
  'lodging',
  CASE
    WHEN r.status = 'completed' THEN r.total_amount
    ELSE ROUND((r.total_amount * 0.35)::numeric, 2)
  END,
  'transfer',
  r.check_in,
  'DEMO_HIST_SALE|' || r.id
FROM demo_reservations r
WHERE NOT EXISTS (
  SELECT 1
  FROM sales s
  WHERE s.description = 'DEMO_HIST_SALE|' || r.id
);

WITH months AS (
  SELECT generate_series(date '2024-01-01', date '2026-12-01', interval '1 month')::date AS month_start
),
expense_rows AS (
  SELECT month_start, 'limpieza'::text AS category, 380000::numeric AS base_amount, 1 AS ord FROM months
  UNION ALL
  SELECT month_start, 'mantenimiento', 240000::numeric, 2 FROM months
  UNION ALL
  SELECT month_start, 'insumos', 160000::numeric, 3 FROM months
)
INSERT INTO expenses (category, amount, payment_method, expense_date, supplier, description)
SELECT
  e.category,
  ROUND(
    (
      e.base_amount
      + CASE
          WHEN EXTRACT(YEAR FROM e.month_start) = 2024 THEN 0
          WHEN EXTRACT(YEAR FROM e.month_start) = 2025 THEN 45000
          ELSE 72000
        END
      + ((EXTRACT(MONTH FROM e.month_start)::int % 4) * 11000)
    )::numeric,
    2
  ),
  'transfer',
  e.month_start + interval '2 day',
  'Proveedor Demo',
  'DEMO_HIST_EXP|' || to_char(e.month_start, 'YYYY-MM') || '|' || e.category || '|' || e.ord
FROM expense_rows e
WHERE NOT EXISTS (
  SELECT 1
  FROM expenses x
  WHERE x.description = 'DEMO_HIST_EXP|' || to_char(e.month_start, 'YYYY-MM') || '|' || e.category || '|' || e.ord
);
