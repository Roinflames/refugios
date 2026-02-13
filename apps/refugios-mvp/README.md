# Refugios MVP

MVP operativo para cabañas con foco en:
- Ventas
- Gastos
- Reservas
- Datos de huéspedes
- Boletas y facturas
- Origen de reserva (web, Airbnb, Booking, etc.)
- Forma de pago
- Migración histórica (año anterior)

## Requisitos
- Node.js 20+
- PostgreSQL (Neon recomendado)
- Docker (opcional)

## Inicio rápido (sin Docker)
```bash
cp .env.example .env
# completar DATABASE_URL
make bootstrap
make dev
```

Panel: `http://localhost:3000`

## Inicio rápido (con Docker)
```bash
cp .env.example .env
# completar DATABASE_URL
make docker-build
make docker-up
```

Panel: `http://localhost:3000`

## Compartir demo por TryCloudflare
Con la app corriendo local (normal o docker):
```bash
make tunnel
```

## Verificar deploy sin entrar a Render
Desde la raiz del repo:
```bash
./tools/check-render-deploy.sh https://tu-app.onrender.com
```

Opcional (estado del ultimo deploy por API de Render):
```bash
export RENDER_API_KEY=...
export RENDER_SERVICE_ID=srv-...
./tools/check-render-deploy.sh https://tu-app.onrender.com
```

## Migraciones
- SQL versionado en `db/migrations`
- Tabla de control `schema_migrations`

Comandos:
```bash
make migrate
make seed
```

Incluye migración de usuarios de prueba en `002_seed_test_users.sql`.

## Importar históricos (reservas/ventas)
Formato CSV simple (ejemplos incluidos):
- `db/samples_reservations.csv`
- `db/samples_sales.csv`

Ejecución:
```bash
npm run db:import -- db/samples_reservations.csv db/samples_sales.csv
```

## Endpoints
- `GET /api/users`
- `GET/POST /api/guests`
- `GET/POST /api/reservations`
- `GET/POST /api/sales`
- `GET/POST /api/expenses`
- `GET/POST /api/documents`
- `GET /api/dashboard/summary`

## Deploy
### Render
1. Conectar repo
2. Deploy con Docker desde `apps/refugios-mvp/Dockerfile` o usar `render.yaml`
3. En Render Dashboard -> Environment, definir `DATABASE_URL` (Neon/Postgres)
4. Redeploy manual

Si `DATABASE_URL` falta, la app inicia pero los endpoints `/api/*` responderan `503`.

### Vercel
1. Importar repo
2. Definir `DATABASE_URL`
3. `vercel.json` enruta a `api/index.js`

### Neon
1. Crear DB PostgreSQL
2. Copiar `DATABASE_URL`
3. Ejecutar `make migrate`

## Documento SRS (IEEE 830)
- `docs/SRS_IEEE830.md`
