# Especificación de Requisitos de Software (SRS)
## Formato IEEE 830

## 1. Introducción
### 1.1 Propósito
Definir los requisitos funcionales y no funcionales del sistema `Refugios MVP`, orientado a la gestión operativa de cabañas: reservas, ventas, gastos, huéspedes y emisión/registro de documentos tributarios.

### 1.2 Alcance
El sistema permite:
- Registrar y consultar huéspedes.
- Registrar y consultar reservas.
- Diferenciar origen de reservas (web, Airbnb, Booking, etc.).
- Registrar ventas y gastos con forma de pago.
- Registrar boletas/facturas asociables a reservas o ventas.
- Visualizar resumen financiero y operativo.
- Migrar datos históricos (reservas/ventas) desde CSV.

### 1.3 Definiciones, acrónimos y abreviaturas
- `MVP`: Minimum Viable Product.
- `SRS`: Software Requirements Specification.
- `API`: Interfaz de programación de aplicaciones.
- `Neon`: servicio PostgreSQL administrado.

### 1.4 Referencias
- IEEE Std 830-1998.
- Código fuente del proyecto: `apps/refugios-mvp`.

### 1.5 Visión general
Este documento describe la perspectiva del producto, funciones, interfaces, restricciones, requisitos detallados y criterios de aceptación.

## 2. Descripción general
### 2.1 Perspectiva del producto
Aplicación web monolítica (frontend estático + backend Node/Express + PostgreSQL) desplegable en Render/Vercel, con base de datos Neon.

### 2.2 Funciones del producto
- Gestión de huéspedes.
- Gestión de reservas con origen y estado.
- Gestión de ventas.
- Gestión de gastos.
- Gestión de documentos (boleta/factura).
- Dashboard de resumen (ventas, gastos, utilidad, cantidad de reservas).
- Migración de históricos por CSV.

### 2.3 Características de usuarios
- `Admin`: configuración y control total.
- `Operador`: registro diario de movimientos.
- `Viewer`: consulta y reportabilidad básica.

### 2.4 Restricciones
- Dependencia de `DATABASE_URL` PostgreSQL con SSL.
- Sin integración automática directa con Airbnb/Booking en MVP.
- Emisión de boleta/factura es registro interno (no integración SII en MVP).

### 2.5 Supuestos y dependencias
- El cliente proporciona datos históricos en formato CSV/Excel exportable.
- El hosting de aplicación y base de datos está disponible.

## 3. Requisitos específicos
### 3.1 Requisitos de interfaces externas
#### 3.1.1 Interfaz de usuario
- Panel web responsivo accesible por navegador moderno.
- Formularios para crear huéspedes, reservas, ventas, gastos y documentos.

#### 3.1.2 Interfaz de software
- API REST JSON.
- Endpoints:
  - `GET /api/users`
  - `GET/POST /api/guests`
  - `GET/POST /api/reservations`
  - `GET/POST /api/sales`
  - `GET/POST /api/expenses`
  - `GET/POST /api/documents`
  - `GET /api/dashboard/summary`

#### 3.1.3 Interfaz de hardware
- No aplica requerimiento especial.

#### 3.1.4 Interfaz de comunicaciones
- HTTP/HTTPS para acceso web y API.
- Conexión TLS hacia PostgreSQL/Neon.

### 3.2 Requisitos funcionales
- `RF-01`: El sistema debe permitir registrar huéspedes con nombre, email, teléfono, documento y notas.
- `RF-02`: El sistema debe permitir crear reservas indicando huésped, origen, forma de pago, fechas, cantidad de pasajeros y monto total.
- `RF-03`: El sistema debe permitir listar reservas con identificación de huésped y origen.
- `RF-04`: El sistema debe permitir registrar ventas con categoría, monto, forma de pago y fecha.
- `RF-05`: El sistema debe permitir registrar gastos con categoría, monto, forma de pago y fecha.
- `RF-06`: El sistema debe permitir registrar documentos tributarios tipo boleta o factura con monto y fecha.
- `RF-07`: El sistema debe mostrar un resumen de ventas, gastos, utilidad y cantidad de reservas.
- `RF-08`: El sistema debe permitir importar reservas y ventas históricas desde archivos CSV.
- `RF-09`: El sistema debe exponer un endpoint de salud (`/health`) para monitoreo de despliegue.
- `RF-10`: El sistema debe incluir migraciones versionadas y migración de usuarios de prueba.

### 3.3 Requisitos no funcionales
- `RNF-01` Rendimiento: responder operaciones de consulta simples en menos de 2 segundos en condiciones normales de red.
- `RNF-02` Disponibilidad: orientado a operación diaria, con despliegue en plataforma cloud.
- `RNF-03` Seguridad: conexión cifrada a base de datos y manejo de secretos por variables de entorno.
- `RNF-04` Mantenibilidad: código modular por rutas y scripts de operación (`Makefile`, migraciones SQL).
- `RNF-05` Portabilidad: ejecución local o en contenedor Docker.

### 3.4 Reglas de negocio
- `RB-01`: Toda reserva debe estar asociada a un huésped existente.
- `RB-02`: El origen de reserva debe pertenecer al catálogo permitido (`web`, `airbnb`, `booking`, `phone`, `walkin`, `other`).
- `RB-03`: La forma de pago debe pertenecer al catálogo permitido (`cash`, `card`, `transfer`, `mercadopago`, `other`).
- `RB-04`: El tipo de documento permitido es `boleta` o `factura`.

## 4. Criterios de aceptación del MVP
- `CA-01`: Se puede crear y listar huéspedes desde UI y API.
- `CA-02`: Se puede crear y listar reservas con origen y forma de pago.
- `CA-03`: Se puede crear y listar ventas y gastos.
- `CA-04`: Se puede crear y listar boletas/facturas.
- `CA-05`: El dashboard muestra métricas totales coherentes con los registros.
- `CA-06`: Las migraciones se ejecutan sin errores en una base limpia.
- `CA-07`: La importación histórica desde CSV inserta registros válidos.

## 5. Anexos
- Rutas de scripts operativos:
  - `apps/refugios-mvp/scripts/migrate.mjs`
  - `apps/refugios-mvp/scripts/seed.mjs`
  - `apps/refugios-mvp/scripts/import-historical.mjs`
- Definición de esquema:
  - `apps/refugios-mvp/db/migrations/001_init.sql`
  - `apps/refugios-mvp/db/migrations/002_seed_test_users.sql`
