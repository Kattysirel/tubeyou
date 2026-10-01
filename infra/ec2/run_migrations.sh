#!/usr/bin/env bash
# Crea (o completa) las tablas users, videos y comments en la base de datos (RDS).
# Lee DATABASE_URL de backend/.env. Es seguro ejecutarlo varias veces.
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
cd /opt/tubeyou/backend

PY="$(command -v python3.12 || command -v python3.11 || command -v python3)"
"$PY" - <<'EOF'
from src import models  # noqa: F401  (registra las tablas)
from src.database.connection import Base, engine

Base.metadata.create_all(bind=engine)
print("Tablas listas:", ", ".join(sorted(Base.metadata.tables)))
EOF
