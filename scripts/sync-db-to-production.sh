#!/usr/bin/env bash
# Sincronizza i dati dal DB locale (MAMP) verso produzione su Hostinger SENZA sovrascrivere.
# Aggiunge solo i dati mancanti (INSERT IGNORE): ciò che è già in produzione resta com'è.
# Utilizza backend/.env per il DB locale e credentials.local per il DB remoto + SSH.
# Uso: dalla root del progetto: ./scripts/sync-db-to-production.sh
# Solo export: EXPORT_ONLY=1 ./scripts/sync-db-to-production.sh

set -e
cd "$(dirname "$0")/.."
EXPORT_ONLY="${EXPORT_ONLY:-0}"

BACKEND_ENV="backend/.env"
CREDENTIALS="credentials.local"
DUMP_FILE="freezer_dump.sql"

# --- Configurazione SSH (override con variabili d'ambiente se serve)
SSH_KEY="${HOSTINGER_SSH_KEY:-$HOME/.ssh/hostinger_deploy}"
SSH_HOST="${HOSTINGER_SSH_HOST:-195.35.49.118}"
SSH_PORT="${HOSTINGER_SSH_PORT:-65002}"
SSH_USER="${HOSTINGER_SSH_USER:-u705656439}"

echo "=== 1. Lettura credenziali DB locale da $BACKEND_ENV"
[[ -f "$BACKEND_ENV" ]] || { echo "Errore: $BACKEND_ENV non trovato."; exit 1; }
while IFS= read -r line; do
  [[ "$line" =~ ^DB_HOST= ]]    && LOCAL_DB_HOST="${line#*=}"
  [[ "$line" =~ ^DB_PORT= ]]    && LOCAL_DB_PORT="${line#*=}"
  [[ "$line" =~ ^DB_DATABASE= ]] && LOCAL_DB_NAME="${line#*=}"
  [[ "$line" =~ ^DB_USERNAME= ]] && LOCAL_DB_USER="${line#*=}"
  [[ "$line" =~ ^DB_PASSWORD= ]] && LOCAL_DB_PASS="${line#*=}"
done < "$BACKEND_ENV"

[[ -n "$LOCAL_DB_NAME" ]] || { echo "Errore: DB_DATABASE non trovato in $BACKEND_ENV"; exit 1; }

echo "=== 2. Export dati locale (solo INSERT IGNORE, niente DROP/CREATE) -> $DUMP_FILE"
mysqldump -h "${LOCAL_DB_HOST:-127.0.0.1}" -P "${LOCAL_DB_PORT:-3306}" \
  -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASS" "$LOCAL_DB_NAME" \
  --single-transaction --no-create-info --insert-ignore --skip-triggers \
  > "$DUMP_FILE"
echo "   Dump creato: $(wc -l < "$DUMP_FILE") righe."

if [[ "$EXPORT_ONLY" = "1" ]]; then
  echo "=== (EXPORT_ONLY) Dump salvato in $DUMP_FILE. Importalo manualmente da phpMyAdmin su Hostinger."
  exit 0
fi

echo "=== 3. Lettura credenziali DB produzione da $CREDENTIALS"
[[ -f "$CREDENTIALS" ]] || { echo "Errore: $CREDENTIALS non trovato (contiene [database_hostinger])."; exit 1; }
IN_SECTION=0
while IFS= read -r line; do
  [[ "$line" =~ ^\[database_hostinger\] ]] && { IN_SECTION=1; continue; }
  [[ "$line" =~ ^\[ ]] && IN_SECTION=0
  (( IN_SECTION )) || continue
  [[ "$line" =~ ^DB_DATABASE= ]] && REMOTE_DB_NAME="${line#*=}"
  [[ "$line" =~ ^DB_USERNAME= ]] && REMOTE_DB_USER="${line#*=}"
  [[ "$line" =~ ^DB_PASSWORD= ]] && REMOTE_DB_PASS="${line#*=}"
done < "$CREDENTIALS"

[[ -n "$REMOTE_DB_NAME" && -n "$REMOTE_DB_USER" ]] || { echo "Errore: [database_hostinger] con DB_DATABASE e DB_USERNAME non trovato in $CREDENTIALS"; exit 1; }

echo "=== 4. Upload dump sul server e import"
scp -i "$SSH_KEY" -P "$SSH_PORT" -o StrictHostKeyChecking=no "$DUMP_FILE" "${SSH_USER}@${SSH_HOST}:~/"
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
  "mysql -h localhost -u '$REMOTE_DB_USER' -p'$REMOTE_DB_PASS' '$REMOTE_DB_NAME' < ~/$DUMP_FILE && rm -f ~/$DUMP_FILE"
echo "   Import completato sul server."

rm -f "$DUMP_FILE"
echo "=== Fatto. I dati mancanti sono stati aggiunti in produzione; il resto è rimasto invariato."
