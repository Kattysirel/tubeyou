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

```
TubeYou/
├── .coderabbit.yaml                revisión automática de PR con CodeRabbit
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── frontend-ci.yml         PR: lint, build y pruebas (no despliega)
│       └── frontend-cd.yml         push a main: OIDC → S3 (+ CloudFront opcional)
├── backend/
│   ├── src/
│   │   ├── core/        config.py · security.py (bcrypt, JWT, usuario actual)
│   │   ├── crud/        user_crud.py · video_crud.py · comment_crud.py
│   │   ├── database/    database.py (engine, sesión, Base)
│   │   ├── models/      user_model.py · video_model.py · comment_model.py
│   │   ├── routers/     user_router.py · video_router.py · comment_router.py
│   │   ├── schemas/     user_schema.py · video_schema.py · comment_schema.py
│   │   ├── services/    storage_service.py · local_service.py · s3_service.py
│   │   └── main.py
│   ├── tests/
│   ├── .env-example · requirements.txt · requirements-dev.txt · pytest.ini
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── atoms/       Button, Input, Avatar, Logo, Icon...
│       │   ├── molecules/   SearchBar, VideoCard, CommentItem, FileDrop...
│       │   ├── organisms/   Navbar, Sidebar, VideoGrid, VideoPlayer, CommentsSection...
│       │   └── templates/   MainLayout, AuthLayout
│       ├── context/     AuthContext · ThemeContext
│       ├── pages/       HomePage · PlayerPage · AuthPage · ProfilePage
│       ├── services/    api.js · userService · videoService · commentService · useApi · format
│       ├── App.jsx · index.css · main.jsx
├── aws/frontend-oidc-s3-setup.yml  plantilla CloudFormation opcional (bucket + OIDC + rol)
├── docs/GUIA_DESPLIEGUE_AWS.md     paso a paso manual en la consola de AWS
├── .env-example
├── .gitignore
└── README.md
```

Backend por capas (`core`, `crud`, `database`, `models`, `routers`, `schemas`, `services`) y frontend con
**Atomic Design** (atoms → molecules → organisms → templates → pages).

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
pip install -r requirements-dev.txt   # incluye pytest
cp .env-example .env          # opcional
cd src
fastapi dev          # desarrollo con recarga automática (puerto 8000)
```
Sin `.env` usa SQLite y guarda los archivos en `backend/uploads/`. Para PostgreSQL define
`DATABASE_URL=postgresql+psycopg://usuario:clave@localhost:5432/tubeyou`.

Pruebas (desde `backend/`): `python -m pytest`.

En producción (EC2) se entra a `src/` y se deja en segundo plano con PM2:

```bash
cd backend/src
pm2 start "fastapi run"
```

### Frontend
```bash
cd frontend
npm install
cp .env-example .env.local    # VITE_API_URL=http://localhost:8000
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

- Guía manual paso a paso (S3, IAM, Security Groups, RDS, EC2, OIDC, GitHub) y evidencias: [docs/GUIA_DESPLIEGUE_AWS.md](docs/GUIA_DESPLIEGUE_AWS.md)
- CI/CD (dos workflows, como en el repositorio de referencia):
  - [frontend-ci.yml](.github/workflows/frontend-ci.yml): en cada PR a `main` corre lint y build del frontend y las pruebas del backend. No despliega.
  - [frontend-cd.yml](.github/workflows/frontend-cd.yml): al hacer push a `main` entra a AWS con OIDC (sin claves), sube `dist/` a S3 e invalida CloudFront si está configurado.
  - El backend se actualiza a mano en la EC2 (`git pull` + `pm2 restart fastapi`).
