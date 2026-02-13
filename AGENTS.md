# AGENTS.md (Global)

Estas reglas aplican por defecto a todos los subrepos bajo `/home/rreyes/projects`, salvo que un repo tenga instrucciones locales más específicas.

## Deploy (Regla principal)
- Siempre priorizar `Render` para deploy compartible con cliente/equipo.
- Link operativo de referencia: `https://dashboard.render.com/`
- Al terminar cambios relevantes: validar si corresponde subir a Git y dejar deploy listo.

### Comando gatillo `#deploy`
- Si el usuario escribe exactamente `#deploy`, se interpreta como aprobacion explicita para:
  1. versionar cambios pendientes (commit),
  2. push a la rama acordada (por defecto `main`),
  3. disparar y/o validar deploy en Render con los scripts del repo.
- Ante `#deploy`, no pedir reconfirmacion, salvo que falten variables criticas de entorno o permisos externos.

### Comandos operativos de chat
- `#help`: mostrar lista de comandos disponibles con descripcion breve de cada uno.
- `#rule <texto>`: agregar una nueva regla operativa al archivo de instrucciones del repo (sin borrar reglas existentes).

## Flujo estándar por proyecto
1. Revisar estado Git y rama activa.
2. Ejecutar validaciones mínimas (lint/test/check si existen).
3. Commit claro y push a `main` o rama acordada.
4. Dejar instrucciones de ejecución/deploy en README.

## Stack y DB
- Preferir Postgres (Neon cuando aplique) con `DATABASE_URL` por variables de entorno.
- Mantener migraciones versionadas (`db/migrations`) y scripts de seed/import.

## Docker
- Si el proyecto es desplegable, incluir:
  - `Dockerfile`
  - `.dockerignore`
  - `docker-compose.yml` (si aporta para local)

## Demo y revisión rápida
- Para revisión inmediata, se puede usar TryCloudflare temporalmente.
- Para cliente final o colaboración continua, usar URL estable en Render.

## Documentación mínima obligatoria
- `README.md` con:
  - cómo correr local
  - variables de entorno
  - cómo desplegar
- Si es proyecto para cliente: incluir SRS base (IEEE 830 o equivalente breve).

## Convenciones de calidad
- Evitar hardcodear secretos en repositorio.
- Mantener cambios enfocados al requerimiento del cliente.
- Si aparece trabajo no pedido, documentarlo como opcional y no bloquear entrega.
