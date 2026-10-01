# TubeYou

Plataforma de videos (SPA) con **React + Vite**, **FastAPI**, **PostgreSQL** y **Amazon S3**,
preparada para desplegarse en **AWS** (S3 + EC2 + RDS) con **GitHub Actions**.
Interfaz en rojo, negro y blanco, con **tema claro y oscuro**.

## Arquitectura

```
React dist/ ─► S3 Frontend
FastAPI     ─► EC2 (Nginx + PM2)
PostgreSQL  ─► RDS
MP4         ─► S3 Videos
JPG/PNG     ─► S3 Miniaturas
```

Backend: **arquitectura por capas** (cada capa es una carpeta con su responsabilidad).

```
backend/src/
├── config.py    configuración y variables de entorno
├── database/    engine, sesión y Base de SQLAlchemy
├── models/      tablas: User, Video, Comment
├── schemas/     validación Pydantic (entrada/salida)
├── crud/        acceso a datos (sin HTTP)
├── routers/     endpoints FastAPI
├── security/    bcrypt + JWT
├── services/    almacenamiento local / S3
└── main.py      punto de entrada
```

Frontend: **Atomic Design** (atoms → molecules → organisms → templates → pages).

```
frontend/src/
├── components/
│   ├── atoms/       Button, Input, Avatar, Logo, Icon...
│   ├── molecules/   SearchBar, VideoCard, CommentItem, FileDrop...
│   ├── organisms/   Navbar, Sidebar, VideoGrid, VideoPlayer, CommentsSection...
│   └── templates/   MainLayout (navbar + sidebar), AuthLayout
├── pages/       HomePage · PlayerPage · AuthPage · ProfilePage
├── context/     AuthContext · ThemeContext
├── hooks/       useApi
├── services/    cliente de la API
├── utils/       formato de fechas y vistas
├── styles/      Tailwind + tokens de color (tema claro/oscuro)
├── App.jsx
└── main.jsx
```

## Páginas
1. **Registro / Login** (`/auth`)
2. **Principal** (`/`): catálogo con búsqueda y orden (todos / populares)
3. **Reproductor** (`/watch/:id`): video, descripción, comentarios y recomendados
4. **Perfil** (`/profile`): datos, contador de videos, publicar, editar y eliminar

## API (documentación en `/docs`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Registro |
| POST | `/login` | Login (devuelve JWT) |
| GET | `/users/{id}` | Datos de usuario y cantidad de videos |
| POST | `/videos` | Publicar (multipart: título, descripción, MP4, miniatura) |
| GET | `/videos` | Listar (`q`, `user_id`, `sort=recent\|popular`) |
| GET | `/videos/{id}` | Detalle |
| PUT | `/videos/{id}` | Editar (solo el dueño) |
| DELETE | `/videos/{id}` | Eliminar (solo el dueño; borra también los archivos) |
| POST/GET | `/videos/{id}/comments` | Comentar / listar |
| GET | `/videos/{id}/recommended` | Recomendados |
| POST | `/videos/{id}/view` | Suma una vista |
| GET | `/health` | Estado del servicio |

Validaciones: video solo **MP4** (máx. 100 MB); miniatura **JPG/JPEG/PNG** (máx. 5 MB).

## Ejecución local

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Linux/Mac: source .venv/bin/activate
pip install -r requirements-dev.txt   # incluye pytest y ruff
cp .env.example .env          # opcional
cd src
fastapi dev          # desarrollo con recarga automática (puerto 8000)
```
Sin `.env` usa SQLite y guarda los archivos en `backend/uploads/`. Para PostgreSQL define
`DATABASE_URL=postgresql+psycopg://usuario:clave@localhost:5432/tubeyou`.

Calidad (desde `backend/`): `ruff check .` y `python -m pytest`.

En producción (EC2) se entra a `src/` y se deja en segundo plano con PM2:

```bash
cd backend/src
pm2 start "fastapi run"
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # VITE_API_URL=http://localhost:8000
npm run dev                   # http://localhost:5173
```

Calidad y producción:

```bash
npm run lint     # ESLint
npm run build    # genera dist/ (es lo único que se sube al bucket del frontend)
```

## Variables de entorno (backend)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL / RDS |
| `SECRET_KEY` | Firma de los JWT |
| `CORS_ORIGINS` | Orígenes permitidos (URL del frontend) |
| `STORAGE_BACKEND` | `local` o `s3` |
| `AWS_REGION`, `S3_VIDEOS_BUCKET`, `S3_THUMBS_BUCKET` | Solo con `s3` |

No hay claves de AWS en el código: la EC2 usa un **IAM Role** y GitHub Actions usa **OIDC**.

## Despliegue

- Guía paso a paso (VPC, Security Groups, RDS, S3, IAM, EC2, OIDC) y evidencias: [infra/README.md](infra/README.md)
- CI/CD: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
  - PR a `main`: `ruff` + `pytest` (backend) y `npm ci`, `lint`, `build` (frontend). No despliega.
  - Push a `main`: validaciones → OIDC (sin claves) → `dist/` a S3 → verificación.
  - El backend se actualiza a mano en la EC2 (`git pull` + `pm2 restart fastapi`).
