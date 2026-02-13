CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  guest_id INT NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  source TEXT NOT NULL CHECK (source IN ('web', 'airbnb', 'booking', 'phone', 'walkin', 'other')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mercadopago', 'other')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  total_amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  reservation_id INT REFERENCES reservations(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'lodging',
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mercadopago', 'other')),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mercadopago', 'other')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  reservation_id INT REFERENCES reservations(id) ON DELETE SET NULL,
  sale_id INT REFERENCES sales(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('boleta', 'factura')),
  document_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'voided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_source ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON documents(document_type, issue_date);
