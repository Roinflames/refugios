#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 \"mensaje\""
  exit 1
fi

MESSAGE="$1"
PROVIDER="${WA_PROVIDER:-webhook}"

send_webhook() {
  : "${WA_WEBHOOK_URL:?Falta WA_WEBHOOK_URL}"
  curl -sS -X POST "$WA_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"${MESSAGE//\"/\\\"}\"}" >/dev/null
}

send_twilio() {
  : "${TWILIO_ACCOUNT_SID:?Falta TWILIO_ACCOUNT_SID}"
  : "${TWILIO_AUTH_TOKEN:?Falta TWILIO_AUTH_TOKEN}"
  : "${TWILIO_WHATSAPP_FROM:?Falta TWILIO_WHATSAPP_FROM (ej: whatsapp:+14155238886)}"
  : "${TWILIO_WHATSAPP_TO:?Falta TWILIO_WHATSAPP_TO (ej: whatsapp:+569XXXXXXXX)}"

  curl -sS -X POST "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json" \
    --data-urlencode "From=${TWILIO_WHATSAPP_FROM}" \
    --data-urlencode "To=${TWILIO_WHATSAPP_TO}" \
    --data-urlencode "Body=${MESSAGE}" \
    -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" >/dev/null
}

send_meta() {
  : "${WA_PHONE_NUMBER_ID:?Falta WA_PHONE_NUMBER_ID}"
  : "${WA_ACCESS_TOKEN:?Falta WA_ACCESS_TOKEN}"
  : "${WA_TO:?Falta WA_TO (numero destino en formato internacional, sin + ni espacios)}"

  curl -sS -X POST "https://graph.facebook.com/v22.0/${WA_PHONE_NUMBER_ID}/messages" \
    -H "Authorization: Bearer ${WA_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"messaging_product\":\"whatsapp\",\"to\":\"${WA_TO}\",\"type\":\"text\",\"text\":{\"preview_url\":false,\"body\":\"${MESSAGE//\"/\\\"}\"}}" >/dev/null
}

case "$PROVIDER" in
  webhook)
    send_webhook
    ;;
  twilio)
    send_twilio
    ;;
  meta)
    send_meta
    ;;
  *)
    echo "WA_PROVIDER no soportado: $PROVIDER"
    echo "Usa uno de: webhook, twilio, meta"
    exit 1
    ;;
esac

echo "Notificacion WhatsApp enviada usando provider: $PROVIDER"
