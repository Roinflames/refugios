CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  source TEXT NOT NULL,
  payment_method TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  amount_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
