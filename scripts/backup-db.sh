#!/usr/bin/env bash
# Dumps the Postgres DB to backups/ and keeps the newest 14. Usage: scripts/backup-db.sh
# Reads DB_* from backend/.env. Schedule with cron, e.g.: 0 3 * * * /path/to/scripts/backup-db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a; . "$ROOT/backend/.env"; set +a
OUT="$ROOT/backups"; mkdir -p "$OUT"
FILE="$OUT/${DB_NAME}-$(date +%Y%m%d-%H%M%S).sql.gz"
PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" "$DB_NAME" | gzip > "$FILE"
ls -1t "$OUT"/*.sql.gz | tail -n +15 | while read -r old; do rm -- "$old"; done
echo "Backup written: $FILE"
