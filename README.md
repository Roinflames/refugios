# Cabanas MVP - Boilerplate Factory

Generador de boilerplates para proyectos listos para deploy.

## Soporte inicial
- Template: `express-api`
- Proveedores: `render`, `vercel`, `neon`, `trycloudflare`

## Crear un proyecto
```bash
npm run new -- --name refugios-api --template express-api --providers render,vercel,neon,trycloudflare
```

## Opciones
- `--name` nombre del proyecto (obligatorio)
- `--template` plantilla base (default: `express-api`)
- `--providers` lista separada por comas
- `--out` ruta de salida (default: directorio actual)

## Branding
Cada proyecto generado incluye:
- `branding/brand.json`
- `branding/README.md` para colocar `branding/logo.png`

## Notificaciones WhatsApp
Scripts incluidos:
- `tools/notify-whatsapp.sh` para enviar mensaje directo.
- `tools/codex-run-and-notify.sh` para ejecutar un comando y notificar al finalizar.

Guia completa: `docs/whatsapp-notifications.md`

Ejemplo rapido:
```bash
source .env.notifications.example
# ajusta variables reales
PROJECT_NAME=refugios ./tools/codex-run-and-notify.sh "npm run new -- --name test-api"
```

## Deploy
El proyecto generado incluye `DEPLOY.md` con pasos por proveedor.
