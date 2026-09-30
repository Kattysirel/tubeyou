#!/usr/bin/env bash
# Se ejecuta EN LA EC2 como ec2-user (lo lanza GitHub Actions mediante AWS Systems Manager).
# Uso: deploy_backend.sh <commit-sha>
#
# La API corre en segundo plano con PM2, desde la carpeta backend/src:
#     cd /opt/tubeyou/backend/src && pm2 start "fastapi run"
# `fastapi run` descubre solo src/main.py y usa el puerto 8000.
set -euo pipefail

APP_DIR=/opt/tubeyou
SHA="${1:-origin/main}"

# Paquetes Python instalados con --user: el comando `fastapi` queda en ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"

cd "$APP_DIR"
git fetch --prune origin main
git reset --hard "$SHA"

PY="$(command -v python3.12 || command -v python3.11 || command -v python3)"
"$PY" -m pip install --quiet --user -r "$APP_DIR/backend/requirements.txt"

cd "$APP_DIR/backend/src"
if pm2 describe fastapi >/dev/null 2>&1; then
  pm2 restart fastapi --update-env
else
  pm2 start "fastapi run"
fi
pm2 save

# Espera a que la API responda
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null; then
    echo "API en linea (commit $SHA)"
    exit 0
  fi
  sleep 2
done
echo "La API no respondio tras el despliegue" >&2
pm2 logs fastapi --lines 50 --nostream >&2 || true
exit 1
