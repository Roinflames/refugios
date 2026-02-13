# Notificaciones WhatsApp al terminar procesos

Este repositorio incluye:
- `tools/notify-whatsapp.sh`: envia un mensaje de WhatsApp.
- `tools/codex-run-and-notify.sh`: ejecuta un comando y notifica OK/ERROR al terminar.

## 1) Webhook (recomendado para iniciar)
Configura un endpoint (n8n/Make/Zapier/backend propio) que reciba:
```json
{ "message": "texto" }
```

Variables:
```bash
export WA_PROVIDER=webhook
export WA_WEBHOOK_URL="https://tu-webhook.ejemplo.com/notify"
```

Prueba:
```bash
./tools/notify-whatsapp.sh "Prueba de mensaje desde Codex"
```

## 2) Twilio WhatsApp
Variables:
```bash
export WA_PROVIDER=twilio
export TWILIO_ACCOUNT_SID="AC..."
export TWILIO_AUTH_TOKEN="..."
export TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
export TWILIO_WHATSAPP_TO="whatsapp:+569XXXXXXXX"
```

## 3) Meta WhatsApp Cloud API
Variables:
```bash
export WA_PROVIDER=meta
export WA_PHONE_NUMBER_ID="123456789"
export WA_ACCESS_TOKEN="EAA..."
export WA_TO="569XXXXXXXX"
```

## Ejecutar comando + notificar
```bash
PROJECT_NAME=refugios ./tools/codex-run-and-notify.sh "npm run build"
```

Si el comando falla, la notificacion se envia igual con estado `ERROR` y codigo de salida.
