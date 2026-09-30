#!/usr/bin/env bash
# Se ejecuta EN LA EC2 (lo lanza GitHub Actions mediante AWS Systems Manager).
# Uso: deploy_backend.sh <commit-sha>
set -euo pipefail

APP_DIR=/opt/tubeyou
SHA="${1:-origin/main}"

cd "$APP_DIR"
git fetch --prune origin main
git reset --hard "$SHA"

cd "$APP_DIR/backend"
PY="$(command -v python3.12 || command -v python3.11 || command -v python3)"
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

sudo cp "$APP_DIR/deploy/tubeyou.service" /etc/systemd/system/tubeyou.service
sudo systemctl daemon-reload
sudo systemctl enable tubeyou >/dev/null 2>&1 || true
sudo systemctl restart tubeyou

# Espera a que la API responda
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null; then
    echo "API en linea (commit $SHA)"
    exit 0
  fi
  sleep 2
done
echo "La API no respondio tras el despliegue" >&2
sudo journalctl -u tubeyou -n 50 --no-pager >&2
exit 1
