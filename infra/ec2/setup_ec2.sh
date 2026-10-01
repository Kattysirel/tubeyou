#!/usr/bin/env bash
# Preparacion UNICA de la EC2 (Amazon Linux 2023). Ejecutar como ec2-user:
#   bash setup_ec2.sh https://github.com/Kattysirel/tubeyou.git
#
# Despues crea backend/.env (ver infra/README.md) y ejecuta run_migrations.sh y deploy_backend.sh.
set -euo pipefail

REPO_URL="${1:?Uso: setup_ec2.sh <url-del-repositorio>}"
APP_DIR=/opt/tubeyou

sudo dnf install -y git nginx nodejs python3.11 python3.11-pip
sudo npm install -g pm2

sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
[ -d "$APP_DIR/.git" ] || git clone "$REPO_URL" "$APP_DIR"

# Dependencias de Python del usuario (el comando `fastapi` queda en ~/.local/bin)
export PATH="$HOME/.local/bin:$PATH"
python3.11 -m pip install --user -r "$APP_DIR/backend/requirements.txt"

# Nginx: puerto 80 -> FastAPI (8000)
sudo cp "$APP_DIR/infra/ec2/nginx-tubeyou.conf" /etc/nginx/conf.d/tubeyou.conf
sudo systemctl enable --now nginx

echo "Listo. Siguiente paso: crear $APP_DIR/backend/.env y ejecutar deploy_backend.sh"
echo "Para que PM2 arranque con la EC2 ejecuta: pm2 startup   (y la linea que imprime)"
