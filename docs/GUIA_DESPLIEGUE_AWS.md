# Guía de despliegue manual en AWS (clic a clic)

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
- Los JSON de esta guía se copian y pegan. Reemplaza en ellos `TUSUFIJO` y `TU_ID_DE_CUENTA`.
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

**Frontend** (`tubeyou-frontend-TUSUFIJO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadFrontend",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tubeyou-frontend-TUSUFIJO/*"
    }
  ]
}
```

**Videos** (`tubeyou-videos-TUSUFIJO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tubeyou-videos-TUSUFIJO/*"
    }
  ]
}
```

**Miniaturas** (`tubeyou-miniaturas-TUSUFIJO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tubeyou-miniaturas-TUSUFIJO/*"
    }
  ]
}
```

**Sitio web del frontend:** bucket `tubeyou-frontend-TUSUFIJO` → pestaña **Properties** → baja hasta
**Static website hosting** → **Edit** → **Enable** → *Hosting type: Host a static website* →
**Index document:** `index.html` · **Error document:** `index.html` → **Save changes**.
Copia la **Bucket website endpoint** (la URL `http://...s3-website-us-east-1.amazonaws.com`): la usarás en el paso 6.

> Si "Edit" de la política sale en gris o da error de acceso público: en el menú izquierdo de S3 →
> **Block Public Access settings for this account** → **Edit** → desmarca todo → **Save**.

---

## 2. Rol de la EC2 (para que suba archivos a S3 sin claves)

**a) Política.** Busca **IAM** → menú izquierdo **Policies** → **Create policy** → pestaña **JSON** →
pega este JSON → **Next** → Policy name: `tubeyou-ec2-s3-policy` → **Create policy**.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TubeYouMediaObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::tubeyou-videos-TUSUFIJO/*",
        "arn:aws:s3:::tubeyou-miniaturas-TUSUFIJO/*"
      ]
    }
  ]
}
```

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
8. Abre **Additional configuration** → **Initial database name:** `tubeyou_db` (importante, si no lo pones no se crea).
9. Desmarca backups/monitoring si quieres ahorrar → **Create database**.

Espera a que el estado sea **Available** (≈10 min). Clic en `tubeyou-db` → pestaña **Connectivity & security** →
copia el **Endpoint** (`tubeyou-db.xxxx.us-east-1.rds.amazonaws.com`).

Usarás estos datos en el `.env` de la EC2 (paso 6): usuario `postgres`, tu contraseña, el **Endpoint**,
puerto `5432` y base de datos `tubeyou_db`.

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
sudo dnf install -y git nginx nodejs python3.11 python3.11-pip
sudo npm install -g pm2
sudo mkdir -p /opt/tubeyou && sudo chown ec2-user:ec2-user /opt/tubeyou
git clone https://github.com/Kattysirel/tubeyou.git /opt/tubeyou
export PATH="$HOME/.local/bin:$PATH"
python3.11 -m pip install --user -r /opt/tubeyou/backend/requirements.txt
```

**b) Variables de entorno** (reemplaza los valores en MAYÚSCULAS):
```bash
cat > /opt/tubeyou/backend/.env <<'EOF'
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA
DB_HOST=ENDPOINT-RDS
DB_PORT=5432
DB_NAME=tubeyou_db
JWT_SECRET_KEY=PEGA_AQUI_UNA_CLAVE_LARGA
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
AWS_REGION=us-east-1
S3_BUCKET_VIDEOS=tubeyou-videos-TUSUFIJO
S3_BUCKET_THUMBNAILS=tubeyou-miniaturas-TUSUFIJO
EOF
chmod 600 /opt/tubeyou/backend/.env
```
- Clave: ejecuta `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` y pega el resultado.
- Nunca subas este `.env` a GitHub (ya está ignorado).

**c) Nginx** (recibe en el puerto 80 y reenvía a FastAPI en el 8000; permite videos de hasta 100 MB):
```bash
sudo tee /etc/nginx/conf.d/tubeyou.conf >/dev/null <<'EOF'
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 110m;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo nginx -t
sudo systemctl enable --now nginx
```

**d) Arrancar la API en segundo plano.** Se entra a `backend/src` y `fastapi run` descubre solo `main.py`
y usa el puerto 8000 (no hace falta indicar puerto ni nombre). Las tablas se crean solas al iniciar:
```bash
export PATH="$HOME/.local/bin:$PATH"
cd /opt/tubeyou/backend/src
pm2 start "fastapi run"
pm2 save
pm2 startup
```
`pm2 startup` imprime una línea que empieza con `sudo env PATH=...`: **cópiala y ejecútala** para que la API
arranque sola al reiniciar la EC2.

**e) Comprobar:** en tu navegador abre `http://IP-API/docs`. Debe verse Swagger. (También `http://IP-API/` → `{"status":"online"}`.)
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

> **Atajo opcional con CloudFormation:** en lugar de hacer los pasos a, b y c a mano, puedes usar la plantilla
> [`aws/frontend-oidc-s3-setup.yml`](../aws/frontend-oidc-s3-setup.yml). En la consola: **CloudFormation →
> Create stack → With new resources → Upload a template file** → sube la plantilla → parámetro `S3BucketName`
> (un nombre nuevo, ej. `tubeyou-frontend-TUSUFIJO`) → marca *"I acknowledge that AWS CloudFormation might create
> IAM resources with custom names"* → **Submit**. En la pestaña **Outputs** copia `RoleArnToAssume`
> (será tu secret `AWS_ROLE_ARN`) y `S3BucketNameOutput` (tu variable `S3_BUCKET_NAME`).
> Si tu cuenta ya tiene el proveedor OIDC de GitHub, pega su ARN en `ExistingOIDCProviderArn`.
> Esta plantilla crea el bucket del frontend, así que en ese caso omite el bucket del frontend del paso 1.
> Los buckets de videos y miniaturas se siguen creando a mano.

**a) Proveedor OIDC** (una sola vez por cuenta): **IAM → Identity providers → Add provider**:
*Provider type:* **OpenID Connect** · *Provider URL:* `https://token.actions.githubusercontent.com` ·
*Audience:* `sts.amazonaws.com` → **Add provider**.

**b) Política de permisos:** IAM → **Policies → Create policy → JSON** → pega este JSON → Name `tubeyou-github-s3-policy` → **Create policy**.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3FrontendDeployPermissions",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::tubeyou-frontend-TUSUFIJO",
        "arn:aws:s3:::tubeyou-frontend-TUSUFIJO/*"
      ]
    }
  ]
}
```

**c) Rol:** IAM → **Roles → Create role**:
1. *Trusted entity type:* **Web identity** · *Identity provider:* `token.actions.githubusercontent.com` ·
   *Audience:* `sts.amazonaws.com` → **Next**.
2. Marca **`tubeyou-github-s3-policy`** → **Next**.
3. Role name: **`tubeyou-github-deploy`** → **Create role**.
4. Entra al rol → pestaña **Trust relationships** → **Edit trust policy** → reemplaza todo por este JSON (con tu ID de cuenta) → **Update policy**.

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::TU_ID_DE_CUENTA:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:Kattysirel/tubeyou:*"
           }
         }
       }
     ]
   }
   ```

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
| `CLOUDFRONT_DISTRIBUTION_ID` | *(opcional)* solo si pones CloudFront delante del bucket |

---

## 8. Publicar el frontend

Hay dos workflows en `.github/workflows/`, igual que en el repositorio de referencia:

| Workflow | Cuándo corre | Qué hace |
|---|---|---|
| **`frontend-ci.yml`** (Frontend CI) | En cada **Pull Request a `main`** y manualmente | `npm ci`, `npm run lint`, `npm run build` y verifica que exista `dist/index.html`. **No despliega.** |
| **`frontend-cd.yml`** (Frontend CD) | Al hacer **push / merge a `main`** (cambios en `frontend/**`) y manualmente | Compila el frontend, entra a AWS con **OIDC** (credenciales temporales), sube `dist/` a S3 y, si definiste `CLOUDFRONT_DISTRIBUTION_ID`, invalida la caché de CloudFront. Se omite mientras no exista `S3_BUCKET_NAME`. |

Para ejecutarlos a mano: pestaña **Actions** → elige el workflow → **Run workflow**.

**¿Para qué sirve CloudFront?** Es opcional: una red de entrega de contenido (CDN) que se pone delante del bucket
para dar HTTPS y cargar más rápido. Si no la usas, deja vacía la variable `CLOUDFRONT_DISTRIBUTION_ID` y ese paso se salta solo.

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
| Error CORS en la consola del navegador | La API está caída o `VITE_API_URL` apunta a otra dirección |
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
7. CI/CD: `frontend-ci.yml` y `frontend-cd.yml` y una ejecución en GitHub Actions (OIDC, sin claves).
