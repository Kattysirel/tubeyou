# Guía de despliegue en AWS

Arquitectura destino:

```
S3 Frontend (dist/)  ──►  Navegador  ──►  EC2 (Nginx :80 → Uvicorn :8000, FastAPI)
                                              ├──► RDS PostgreSQL (subred privada)
                                              ├──► S3 Videos      (MP4)
                                              └──► S3 Miniaturas  (JPG/JPEG/PNG)
```

Sustituye `REGION`, `CUENTA`, `OWNER/REPO` y los nombres de bucket por los tuyos.
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

Las tablas (`users`, `videos`, `comments`) se crean solas al arrancar la API.

## 3. Buckets S3 (3)

| Bucket | Contenido | Acceso |
|---|---|---|
| `tubeyou-frontend` | Solo el contenido de `dist/` | Sitio web estático (lectura pública) |
| `tubeyou-videos` | MP4 (máx. 100 MB) | Lectura pública de objetos |
| `tubeyou-miniaturas` | JPG / JPEG / PNG | Lectura pública de objetos |

Para cada bucket: *Permissions → Block public access → desactivar*, y añadir la política
(cambia el nombre del bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::tubeyou-videos/*"
  }]
}
```

**Frontend:** *Properties → Static website hosting → Enable*, `Index document = index.html` y
`Error document = index.html` (así funcionan las rutas de React Router como `/watch/3` al recargar).

Nunca subas `src/`, `node_modules/` ni `package.json` al bucket del frontend.

## 4. IAM Role de la EC2 (sin claves en el código)

Crea el rol `tubeyou-ec2-role` (servicio de confianza: EC2), adjunta:

- `AmazonSSMManagedInstanceCore` (permite que GitHub Actions despliegue sin SSH).
- Política propia:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": [
      "arn:aws:s3:::tubeyou-videos/*",
      "arn:aws:s3:::tubeyou-miniaturas/*"
    ]
  }]
}
```

Asocia el rol a la instancia (*Actions → Security → Modify IAM role*). `boto3` toma las credenciales
temporales del rol automáticamente.

## 5. EC2 (FastAPI)

Amazon Linux 2023, `t3.micro`, con `sg-ec2` y el rol anterior. Una sola vez, por SSH o Session Manager:

```bash
sudo dnf install -y git nginx python3.11 python3.11-pip
sudo mkdir -p /opt/tubeyou && sudo chown ec2-user:ec2-user /opt/tubeyou
git clone https://github.com/OWNER/REPO.git /opt/tubeyou
# Repositorio privado: usa una deploy key (solo lectura) o un token en la URL del remote.
```

Variables de entorno (**fuera del repositorio**) en `/etc/tubeyou.env`:

```bash
sudo tee /etc/tubeyou.env >/dev/null <<'EOF'
DATABASE_URL=postgresql+psycopg://USUARIO:CLAVE@ENDPOINT-RDS:5432/tubeyou
SECRET_KEY=<cadena-aleatoria-larga>
CORS_ORIGINS=http://tubeyou-frontend.s3-website-REGION.amazonaws.com
STORAGE_BACKEND=s3
AWS_REGION=REGION
S3_VIDEOS_BUCKET=tubeyou-videos
S3_THUMBS_BUCKET=tubeyou-miniaturas
EOF
sudo chmod 600 /etc/tubeyou.env
```

Generar `SECRET_KEY`: `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.

Nginx y primer arranque:

```bash
sudo cp /opt/tubeyou/deploy/nginx.conf /etc/nginx/conf.d/tubeyou.conf
sudo systemctl enable --now nginx
bash /opt/tubeyou/deploy/deploy_backend.sh origin/main
```

La API queda en `http://IP-PUBLICA/docs`. `client_max_body_size 110m` en Nginx permite videos de hasta 100 MB.

## 6. GitHub Actions + OIDC (puntos extra)

**a) Proveedor OIDC** (una vez por cuenta): IAM → Identity providers → *OpenID Connect*
→ URL `https://token.actions.githubusercontent.com`, audiencia `sts.amazonaws.com`.

**b) Rol `tubeyou-github-deploy`** con esta política de confianza:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::CUENTA:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:environment:production" }
    }
  }]
}
```

(El job de despliegue usa `environment: production`, por eso el `sub` termina en `environment:production`.)

Permisos del rol:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::tubeyou-frontend" },
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"], "Resource": "arn:aws:s3:::tubeyou-frontend/*" },
    { "Effect": "Allow", "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:REGION:CUENTA:instance/ID-INSTANCIA",
        "arn:aws:ssm:REGION::document/AWS-RunShellScript"
      ] },
    { "Effect": "Allow", "Action": ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"], "Resource": "*" }
  ]
}
```

**c) Variables del repositorio** (*Settings → Secrets and variables → Actions → Variables*). No son secretos:

| Variable | Ejemplo |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `AWS_ROLE_ARN` | `arn:aws:iam::CUENTA:role/tubeyou-github-deploy` |
| `S3_FRONTEND_BUCKET` | `tubeyou-frontend` |
| `EC2_INSTANCE_ID` | `i-0abc...` |
| `API_URL` | `http://IP-PUBLICA` (sin barra final) |
| `FRONTEND_URL` | `http://tubeyou-frontend.s3-website-REGION.amazonaws.com` |

**d)** Crea el *Environment* `production` (Settings → Environments). Opcional: exige aprobación manual.

**Comportamiento del workflow** (`.github/workflows/deploy.yml`):

- **Pull Request a `main`:** instala, prueba el backend (`pytest`) y hace `npm ci`, `npm run lint` y `npm run build` del frontend. **No despliega.**
- **Push / merge a `main`:** ejecuta lo anterior y, si pasa, asume el rol por OIDC, sube `dist/` a S3, actualiza la EC2 vía SSM y comprueba `/health`, `/docs`, `/videos` y el sitio.
- **workflow_dispatch:** ejecución manual (despliega solo desde `main`).

## 7. Comprobación final

1. `http://IP-PUBLICA/docs` muestra Swagger.
2. Abre la URL del frontend, regístrate, publica un video y confirma que los archivos aparecen en los buckets Videos y Miniaturas y las filas en RDS.
3. Recarga `/watch/1` y `/profile` (deben abrir gracias al error document `index.html`).
