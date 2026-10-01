# Guía manual de AWS (clic a clic)

Todo se hace a mano desde la consola de AWS. El único paso automático es el del frontend:
GitHub Actions publica `dist/` en S3 usando OIDC (lógica igual a la del repositorio de referencia
[LeirBaGMC/API-con-EC2](https://github.com/LeirBaGMC/API-con-EC2)). El backend se actualiza a mano en la EC2.

```
Navegador ─► S3 Frontend (sitio web)
         └─► EC2 (Nginx :80 → PM2 + FastAPI :8000) ─► RDS PostgreSQL
                                                    ├─► S3 Videos
                                                    └─► S3 Miniaturas
```

**Reglas para toda la guía**
- Trabaja siempre en **una sola región** (esquina superior derecha de la consola). Recomendada: **US East (N. Virginia) `us-east-1`**.
- Los nombres de bucket son únicos en todo el mundo: reemplaza **`TUSUFIJO`** por algo tuyo (ej. `sirel`). Ejemplo: `tubeyou-frontend-sirel`.
- Los archivos de `infra/iam` e `infra/s3` son los JSON para copiar y pegar. Reemplaza en ellos `TUSUFIJO` y `TU_ID_DE_CUENTA`.
- Tu **ID de cuenta** (12 dígitos): clic en tu nombre arriba a la derecha → aparece debajo de "Account ID".

Orden: **1 S3 → 2 IAM (rol de la EC2) → 3 Red/Security Groups → 4 RDS → 5 EC2 → 6 backend en la EC2 → 7 OIDC + GitHub → 8 frontend**.

---

## 1. Los 3 buckets S3

Busca **S3** en la barra superior → **Create bucket**. Repite 3 veces:

| Nombre | Para qué |
|---|---|
| `tubeyou-frontend-TUSUFIJO` | Solo el contenido de `dist/` |
| `tubeyou-videos-TUSUFIJO` | MP4 |
| `tubeyou-miniaturas-TUSUFIJO` | JPG / JPEG / PNG |

En cada uno:
1. **Bucket name:** el nombre de la tabla. **AWS Region:** la misma de siempre.
2. **Object Ownership:** deja *ACLs disabled*.
3. **Block Public Access settings:** **desmarca "Block all public access"** y marca el recuadro de
   confirmación *"I acknowledge that the current settings might result in this bucket and the objects within becoming public"*.
4. **Create bucket**.

**Política de lectura pública** (en cada bucket): clic en el bucket → pestaña **Permissions** →
**Bucket policy** → **Edit** → pega el JSON → **Save changes**.
- Frontend → [s3/frontend-bucket-policy.json](s3/frontend-bucket-policy.json)
- Videos → [s3/videos-bucket-policy.json](s3/videos-bucket-policy.json)
- Miniaturas → [s3/miniaturas-bucket-policy.json](s3/miniaturas-bucket-policy.json)

**Sitio web del frontend:** bucket `tubeyou-frontend-TUSUFIJO` → pestaña **Properties** → baja hasta
**Static website hosting** → **Edit** → **Enable** → *Hosting type: Host a static website* →
**Index document:** `index.html` · **Error document:** `index.html` → **Save changes**.
Copia la **Bucket website endpoint** (la URL `http://...s3-website-us-east-1.amazonaws.com`): la usarás en el paso 6.

> Si "Edit" de la política sale en gris o da error de acceso público: en el menú izquierdo de S3 →
> **Block Public Access settings for this account** → **Edit** → desmarca todo → **Save**.

---

## 2. Rol de la EC2 (para que suba archivos a S3 sin claves)

**a) Política.** Busca **IAM** → menú izquierdo **Policies** → **Create policy** → pestaña **JSON** →
pega [iam/ec2-role-s3-policy.json](iam/ec2-role-s3-policy.json) → **Next** → Policy name: `tubeyou-ec2-s3-policy` → **Create policy**.

**b) Rol.** IAM → **Roles** → **Create role**:
1. *Trusted entity type:* **AWS service** · *Use case:* **EC2** → **Next**.
2. Busca y marca **`tubeyou-ec2-s3-policy`** → **Next**.
3. Role name: **`tubeyou-ec2-role`** → **Create role**.

---

## 3. Security Groups (firewalls)

Busca **EC2** → menú izquierdo **Security Groups** → **Create security group**.

**sg-ec2** (para el servidor):
- Name: `sg-ec2` · Description: `API TubeYou` · VPC: la *default*.
- **Inbound rules → Add rule:**
  - Type **HTTP** · Source **Anywhere-IPv4** (`0.0.0.0/0`)
  - Type **SSH** · Source **My IP**
- **Create security group**.

**sg-rds** (para la base de datos):
- Name: `sg-rds` · Description: `PostgreSQL TubeYou` · VPC: la *default*.
- **Inbound rules → Add rule:** Type **PostgreSQL** (puerto 5432) · Source **Custom** → escribe `sg` y elige **`sg-ec2`**
  (el grupo, no una IP).
- **Create security group**.

---

## 4. Base de datos RDS (PostgreSQL)

Busca **RDS** → **Create database**:
1. **Standard create** · Engine: **PostgreSQL**.
2. **Templates:** **Free tier** (o *Sandbox*).
3. **DB instance identifier:** `tubeyou-db`.
4. **Master username:** `postgres` · **Credentials management: Self managed** → escribe y **anota la contraseña**.
5. **Instance configuration:** `db.t3.micro` (o la que permita el free tier).
6. **Storage:** 20 GiB, sin autoscaling.
7. **Connectivity:** *Don't connect to an EC2 compute resource* · VPC *default* · **Public access: No** ·
   **Existing VPC security groups:** quita *default* y elige **`sg-rds`**.
8. Abre **Additional configuration** → **Initial database name:** `tubeyou` (importante, si no lo pones no se crea).
9. Desmarca backups/monitoring si quieres ahorrar → **Create database**.

Espera a que el estado sea **Available** (≈10 min). Clic en `tubeyou-db` → pestaña **Connectivity & security** →
copia el **Endpoint** (`tubeyou-db.xxxx.us-east-1.rds.amazonaws.com`).

Tu `DATABASE_URL` será:
`postgresql+psycopg://postgres:TU_CONTRASEÑA@ENDPOINT:5432/tubeyou`
(si la contraseña tiene `@`, `:` o `/`, cámbiala por una sin símbolos especiales).

---

## 5. Servidor EC2

EC2 → **Instances** → **Launch instances**:
1. **Name:** `tubeyou-api`.
2. **AMI:** **Amazon Linux 2023**.
3. **Instance type:** `t3.micro` (free tier).
4. **Key pair:** *Proceed without a key pair* (nos conectaremos desde el navegador).
5. **Network settings → Edit:** VPC *default* · Auto-assign public IP **Enable** ·
   *Select existing security group* → **`sg-ec2`**.
6. **Configure storage:** 20 GiB gp3.
7. **Advanced details → IAM instance profile:** **`tubeyou-ec2-role`**.
8. **Launch instance**.

**IP fija (recomendado, para que la URL de la API no cambie al reiniciar):** EC2 → **Elastic IPs** →
**Allocate Elastic IP address** → **Allocate** → marca la IP → **Actions → Associate Elastic IP address** →
elige la instancia `tubeyou-api` → **Associate**. Esa será tu **IP pública** (`IP-API`).

---

## 6. Backend en la EC2

EC2 → **Instances** → marca `tubeyou-api` → **Connect** → pestaña **EC2 Instance Connect** → **Connect**.
Se abre una terminal en el navegador. Pega estos bloques:

**a) Instalar todo** (git, nginx, node, python, pm2) y clonar el repositorio:
```bash
curl -fsSL https://raw.githubusercontent.com/Kattysirel/tubeyou/main/infra/ec2/setup_ec2.sh -o setup_ec2.sh
bash setup_ec2.sh https://github.com/Kattysirel/tubeyou.git
```

**b) Variables de entorno** (reemplaza los valores en MAYÚSCULAS):
```bash
cat > /opt/tubeyou/backend/.env <<'EOF'
DATABASE_URL=postgresql+psycopg://postgres:TU_CONTRASEÑA@ENDPOINT-RDS:5432/tubeyou
SECRET_KEY=PEGA_AQUI_UNA_CLAVE_LARGA
CORS_ORIGINS=http://URL-DEL-SITIO-S3
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
S3_VIDEOS_BUCKET=tubeyou-videos-TUSUFIJO
S3_THUMBS_BUCKET=tubeyou-miniaturas-TUSUFIJO
EOF
chmod 600 /opt/tubeyou/backend/.env
```
- `CORS_ORIGINS` = la **Bucket website endpoint** del paso 1, **sin barra final** (empieza con `http://`).
- Clave: ejecuta `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` y pega el resultado.
- Nunca subas este `.env` a GitHub (ya está ignorado).

**c) Crear las tablas y arrancar la API en segundo plano:**
```bash
bash /opt/tubeyou/infra/ec2/run_migrations.sh

export PATH="$HOME/.local/bin:$PATH"
cd /opt/tubeyou/backend/src
pm2 start "fastapi run"
pm2 save
pm2 startup
```
`pm2 startup` imprime una línea que empieza con `sudo env PATH=...`: **cópiala y ejecútala** para que la API
arranque sola al reiniciar la EC2.

**d) Comprobar:** en tu navegador abre `http://IP-API/docs`. Debe verse Swagger. (También `http://IP-API/health` → `{"status":"ok"}`.)
Si falla: `pm2 logs fastapi` y `sudo systemctl status nginx`.

**Actualizar el backend más adelante** (después de un `git push`):
```bash
export PATH="$HOME/.local/bin:$PATH"
cd /opt/tubeyou && git pull
python3.11 -m pip install --user -r backend/requirements.txt
pm2 restart fastapi
```

---

## 7. OIDC y GitHub Actions (despliegue del frontend)

**a) Proveedor OIDC** (una sola vez por cuenta): **IAM → Identity providers → Add provider**:
*Provider type:* **OpenID Connect** · *Provider URL:* `https://token.actions.githubusercontent.com` ·
*Audience:* `sts.amazonaws.com` → **Add provider**.

**b) Política de permisos:** IAM → **Policies → Create policy → JSON** → pega
[iam/github-deploy-policy.json](iam/github-deploy-policy.json) → Name `tubeyou-github-s3-policy` → **Create policy**.

**c) Rol:** IAM → **Roles → Create role**:
1. *Trusted entity type:* **Web identity** · *Identity provider:* `token.actions.githubusercontent.com` ·
   *Audience:* `sts.amazonaws.com` → **Next**.
2. Marca **`tubeyou-github-s3-policy`** → **Next**.
3. Role name: **`tubeyou-github-deploy`** → **Create role**.
4. Entra al rol → pestaña **Trust relationships** → **Edit trust policy** → reemplaza todo por
   [iam/github-oidc-trust-policy.json](iam/github-oidc-trust-policy.json) (con tu ID de cuenta) → **Update policy**.
5. Copia el **ARN** del rol (arriba, `arn:aws:iam::123456789012:role/tubeyou-github-deploy`).

**d) GitHub:** repositorio `Kattysirel/tubeyou` → **Settings → Secrets and variables → Actions**.

Pestaña **Secrets → New repository secret:**

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | el ARN del paso c.5 |

Pestaña **Variables → New repository variable** (una por una):

| Name | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `S3_BUCKET_NAME` | `tubeyou-frontend-TUSUFIJO` |
| `VITE_API_URL` | `http://IP-API` (sin barra final) |

---

## 8. Publicar el frontend

El despliegue se activa solo con un push a `main` (o a mano: **Actions → TubeYou - CI/CD (AWS) → Run workflow**).

- **Pull Request a `main`:** `ruff` y `pytest` del backend; `npm ci`, `npm run lint` y `npm run build` del frontend. **No despliega.**
- **Push / merge a `main`:** lo anterior y, si pasa, entra a AWS con OIDC (credenciales temporales),
  sube `dist/` a S3 y comprueba que `index.html` quedó publicado. Se omite mientras no exista la variable `S3_BUCKET_NAME`.

Cuando termine en verde, abre la **Bucket website endpoint** del paso 1: ahí está TubeYou.
Recargar `/watch/1` o `/profile` funciona porque el *Error document* es `index.html`.

> Si cambias `VITE_API_URL` o la IP de la API, vuelve a ejecutar el workflow para recompilar el frontend.

---

## 9. Comprobación final

1. `http://IP-API/docs` muestra Swagger.
2. En el sitio S3: crea una cuenta, inicia sesión, publica un video (MP4 + imagen), reprodúcelo y comenta.
3. En S3 verás el archivo en `tubeyou-videos-TUSUFIJO` y la imagen en `tubeyou-miniaturas-TUSUFIJO`.
4. Tema claro/oscuro con el ícono de luna/sol.

**Si algo falla**

| Síntoma | Causa probable |
|---|---|
| El sitio carga pero no muestra videos / "No se pudo conectar" | `VITE_API_URL` incorrecta, o la API caída (`pm2 list`) |
| Error CORS en la consola del navegador | `CORS_ORIGINS` no coincide exactamente con la URL del sitio S3 |
| `/docs` no abre | Falta la regla HTTP en `sg-ec2`, o `pm2`/`nginx` detenidos |
| La API no conecta a la base | `sg-rds` sin regla desde `sg-ec2`, o contraseña/endpoint mal en `.env` |
| Falla la subida de videos | Falta el rol `tubeyou-ec2-role` en la EC2, o nombres de bucket distintos en `.env` |
| El video sube pero no se ve | Falta la política de lectura pública del bucket de videos/miniaturas |
| Actions: "Not authorized to perform sts:AssumeRoleWithWebIdentity" | El `sub` de la política de confianza no es `repo:Kattysirel/tubeyou:*` |

---

# Evidencias para la entrega

## Enlaces
- [ ] Repositorio GitHub: `https://github.com/Kattysirel/tubeyou`
- [ ] URL pública de la SPA (S3 Frontend)
- [ ] URL pública de FastAPI: `http://IP-API/docs`

## Infraestructura AWS
- [ ] **EC2:** instancia en ejecución (ID, IP pública, Security Group, IAM Role)
- [ ] **RDS:** instancia disponible (PostgreSQL, endpoint, Security Group)
- [ ] **S3 Frontend:** `index.html` y `assets/` (contenido de `dist/`)
- [ ] **S3 Videos:** archivos `.mp4`
- [ ] **S3 Miniaturas:** archivos `.jpg/.jpeg/.png`
- [ ] **IAM:** rol de la EC2 y rol de GitHub (OIDC)
- [ ] **GitHub Actions:** ejecución verde (PR sin despliegue y push a `main` con despliegue)

## Funcionamiento
- [ ] Registro · [ ] Login · [ ] Catálogo · [ ] Reproducción · [ ] Comentarios · [ ] Recomendados
- [ ] Perfil · [ ] Publicar · [ ] Editar · [ ] Eliminar · [ ] Tema claro/oscuro

## Guion del video explicativo (5–8 min)
1. Arquitectura: SPA en S3 → FastAPI en EC2 → RDS y buckets S3.
2. Consola AWS: EC2, RDS, los 3 buckets, Security Groups, IAM Role.
3. `/docs` de FastAPI: los endpoints mínimos.
4. Demo: registro → login → publicar → catálogo → reproducir → comentar → recomendados.
5. Perfil: editar y eliminar; comprobar el cambio en S3.
6. Código: backend por capas y frontend con Atomic Design.
7. CI/CD: `deploy.yml` y una ejecución en GitHub Actions (OIDC, sin claves).
