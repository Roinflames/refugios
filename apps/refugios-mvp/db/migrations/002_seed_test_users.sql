INSERT INTO app_users (full_name, email, role, is_active)
VALUES
  ('Rodrigo Reyes', 'rodrigo@refugios.local', 'admin', true),
  ('Gestor Operaciones', 'operaciones@refugios.local', 'operator', true),
  ('Contabilidad Demo', 'conta@refugios.local', 'viewer', true)
ON CONFLICT (email) DO NOTHING;
