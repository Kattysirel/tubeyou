# Infraestructura y despliegue en AWS

```
infra/
├── ec2/
│   ├── nginx-tubeyou.conf     Nginx: puerto 80 → FastAPI (8000), videos hasta 100 MB
│   ├── setup_ec2.sh           preparación única de la EC2
│   ├── run_migrations.sh      crea las tablas en RDS
│   └── deploy_backend.sh      lo ejecuta GitHub Actions: git reset + pip + pm2 restart
├── iam/
│   ├── ec2-role-s3-policy.json       permisos de la EC2 sobre los buckets de videos y miniaturas
│   ├── github-deploy-policy.json     permisos del rol de GitHub (S3 frontend + SSM)
│   └── github-oidc-trust-policy.json política de confianza OIDC (sin claves permanentes)
└── s3/
    ├── frontend-bucket-policy.json   lectura pública del sitio
    └── media-buckets-policy.json     lectura pública de videos y miniaturas
```

Arquitectura destino:

```
S3 Frontend (dist/)  ──►  Navegador  ──►  EC2 (Nginx :80 → PM2 + FastAPI :8000)
                                              ├──► RDS PostgreSQL (subred privada)
                                              ├──► S3 Videos      (MP4)
                                              └──► S3 Miniaturas  (JPG/JPEG/PNG)
```

Sustituye `REGION`, `CUENTA`, `ID-INSTANCIA` y los nombres de bucket (`tubeyou-frontend`,
`tubeyou-videos`, `tubeyou-miniaturas`) por los tuyos en los archivos JSON.
**Ninguna credencial de AWS se escribe en el código**: la EC2 usa un *IAM Role* y GitHub usa *OIDC*.

## 1. Red (VPC y Security Groups)

Puedes usar la VPC por defecto o crear una con subredes públicas (EC2) y privadas (RDS).

| Security Group | Entrada |
|---|---|
| `sg-ec2` | TCP 80 (y 443 si usas HTTPS) desde `0.0.0.0/0`. SSH 22 solo desde tu IP (opcional, el despliegue usa SSM) |
| `sg-rds` | TCP 5432 **solo desde `sg-ec2`** (origen = el propio grupo, no una IP) |

RDS con **Public access = No**.

## 2. RDS (PostgreSQL)

1. Crear instancia PostgreSQL (`db.t3.micro` / free tier), base de datos inicial `tubeyou`.
2. Asociarle `sg-rds`, misma VPC que la EC2.
3. `DATABASE_URL=postgresql+psycopg://USUARIO:CLAVE@ENDPOINT-RDS:5432/tubeyou`

## 3. Buckets S3 (3)

| Bucket | Contenido | Acceso |
|---|---|---|
| `tubeyou-frontend` | Solo el contenido de `dist/` | Sitio web estático |
| `tubeyou-videos` | MP4 (máx. 100 MB) | Lectura pública de objetos |
| `tubeyou-miniaturas` | JPG / JPEG / PNG | Lectura pública de objetos |

Para cada bucket: *Permissions → Block public access → desactivar* y pegar la política:
[s3/frontend-bucket-policy.json](s3/frontend-bucket-policy.json) en el bucket del frontend y
[s3/media-buckets-policy.json](s3/media-buckets-policy.json) en los de videos y miniaturas
(en esta última, deja en `Resource` solo el ARN del bucket al que se la pegas).

**Frontend:** *Properties → Static website hosting → Enable*, `Index document = index.html` y
`Error document = index.html` (así funcionan rutas como `/watch/3` al recargar).
Nunca subas `src/`, `node_modules/` ni `package.json` a ese bucket.

## 4. IAM Role de la EC2

Crea el rol `tubeyou-ec2-role` (servicio de confianza: EC2) y adjunta:

- `AmazonSSMManagedInstanceCore` (permite desplegar desde GitHub sin SSH).
- La política [iam/ec2-role-s3-policy.json](iam/ec2-role-s3-policy.json).

Asócialo a la instancia (*Actions → Security → Modify IAM role*). `boto3` toma las credenciales
temporales del rol automáticamente.

## 5. EC2 (FastAPI con PM2)

Amazon Linux 2023, `t3.micro`, con `sg-ec2` y el rol anterior. Por SSH o Session Manager:

```bash
curl -fsSL https://raw.githubusercontent.com/Kattysirel/tubeyou/main/infra/ec2/setup_ec2.sh -o setup_ec2.sh
bash setup_ec2.sh https://github.com/Kattysirel/tubeyou.git
```

Variables de entorno (**fuera del repositorio**; `.env` está en `.gitignore`):

```bash
cat > /opt/tubeyou/backend/.env <<'EOF'
DATABASE_URL=postgresql+psycopg://USUARIO:CLAVE@ENDPOINT-RDS:5432/tubeyou
SECRET_KEY=<cadena-aleatoria-larga>
CORS_ORIGINS=http://tubeyou-frontend.s3-website-REGION.amazonaws.com
STORAGE_BACKEND=s3
AWS_REGION=REGION
S3_VIDEOS_BUCKET=tubeyou-videos
S3_THUMBS_BUCKET=tubeyou-miniaturas
EOF
chmod 600 /opt/tubeyou/backend/.env
```

Generar `SECRET_KEY`: `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.

Crear las tablas y arrancar la API en segundo plano. Se entra a `backend/src` y `fastapi run`
descubre solo `main.py` y usa el puerto 8000:

```bash
bash /opt/tubeyou/infra/ec2/run_migrations.sh

export PATH="$HOME/.local/bin:$PATH"
cd /opt/tubeyou/backend/src
pm2 start "fastapi run"
pm2 save
pm2 startup        # ejecuta la línea que imprime, para que arranque al reiniciar la EC2
```

Útiles: `pm2 list`, `pm2 logs fastapi`, `pm2 restart fastapi`.
La API queda en `http://IP-PUBLICA/docs`.

## 6. GitHub Actions + OIDC (puntos extra)

**a) Proveedor OIDC** (una vez por cuenta): IAM → Identity providers → *OpenID Connect* →
URL `https://token.actions.githubusercontent.com`, audiencia `sts.amazonaws.com`.

**b) Rol `tubeyou-github-deploy`:**
- Política de confianza: [iam/github-oidc-trust-policy.json](iam/github-oidc-trust-policy.json)
  (el job de despliegue usa `environment: production`, por eso el `sub` termina en `environment:production`).
- Permisos: [iam/github-deploy-policy.json](iam/github-deploy-policy.json).

**c) Variables del repositorio** (*Settings → Secrets and variables → Actions → Variables*; no son secretos):

| Variable | Ejemplo |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `AWS_ROLE_ARN` | `arn:aws:iam::CUENTA:role/tubeyou-github-deploy` |
| `S3_FRONTEND_BUCKET` | `tubeyou-frontend` |
| `EC2_INSTANCE_ID` | `i-0abc...` |
| `API_URL` | `http://IP-PUBLICA` (sin barra final) |
| `FRONTEND_URL` | `http://tubeyou-frontend.s3-website-REGION.amazonaws.com` |

**d)** Crea el *Environment* `production` (Settings → Environments).

**Comportamiento de [deploy.yml](../.github/workflows/deploy.yml):**

- **Pull Request a `main`:** `ruff` y `pytest` en el backend; `npm ci`, `npm run lint` y `npm run build`
  en el frontend. **No despliega.**
- **Push / merge a `main`:** lo anterior y, si pasa, asume el rol por OIDC, sube `dist/` a S3,
  actualiza la EC2 vía SSM (`deploy_backend.sh`) y comprueba `/health`, `/docs`, `/videos` y el sitio.
  Se omite mientras no exista la variable `AWS_ROLE_ARN`.
- **workflow_dispatch:** ejecución manual (despliega solo desde `main`).

## 7. Comprobación final

1. `http://IP-PUBLICA/docs` muestra Swagger.
2. Abre la URL del frontend, regístrate, publica un video y confirma que los archivos aparecen en los
   buckets de Videos y Miniaturas y las filas en RDS.
3. Recarga `/watch/1` y `/profile` (deben abrir gracias al error document `index.html`).

---

# Evidencias para la entrega

## Enlaces
- [ ] Repositorio GitHub: `https://github.com/Kattysirel/tubeyou`
- [ ] URL pública de la SPA (S3 Frontend)
- [ ] URL pública de FastAPI: `http://IP-PUBLICA/docs`

## Infraestructura AWS
- [ ] **EC2:** instancia en ejecución (ID, IP pública, Security Group, IAM Role)
- [ ] **RDS:** instancia disponible (PostgreSQL, endpoint, Security Group)
- [ ] **S3 Frontend:** `index.html` y `assets/` (contenido de `dist/`)
- [ ] **S3 Videos:** archivos `.mp4`
- [ ] **S3 Miniaturas:** archivos `.jpg/.jpeg/.png`
- [ ] **IAM:** rol de la EC2 y rol de GitHub (OIDC)
- [ ] **GitHub Actions:** ejecución verde de `deploy.yml` (PR sin despliegue y push a `main` con despliegue)

## Funcionamiento
- [ ] Registro · [ ] Login · [ ] Catálogo · [ ] Reproducción · [ ] Comentarios · [ ] Recomendados
- [ ] Perfil (datos, cantidad de videos, lista) · [ ] Publicar · [ ] Editar · [ ] Eliminar · [ ] Tema claro/oscuro

## Guion del video explicativo (5–8 min)
1. Arquitectura: SPA en S3 → FastAPI en EC2 → RDS y buckets S3.
2. Consola AWS: EC2, RDS, los 3 buckets, Security Groups, IAM Role.
3. `/docs` de FastAPI: los endpoints mínimos.
4. Demo: registro → login → publicar → catálogo → reproducir → comentar → recomendados.
5. Perfil: editar y eliminar; comprobar el cambio en S3.
6. Código: backend por capas (`crud/`, `database/`, `models/`, `routers/`, `schemas/`) y frontend con Atomic Design.
7. CI/CD: `deploy.yml` y una ejecución en GitHub Actions (OIDC, sin claves).
