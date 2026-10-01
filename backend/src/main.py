import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Asegurar que el directorio 'src' este en sys.path: asi `cd src && fastapi run` (PM2) resuelve
# los modulos igual en local y en la EC2.
src_dir = str(Path(__file__).parent.resolve())
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from database.database import create_database  # noqa: E402
from routers.comment_router import router as comment_router  # noqa: E402
from routers.user_router import router as user_router  # noqa: E402
from routers.video_router import router as video_router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear las tablas en Amazon RDS / PostgreSQL al iniciar
    create_database()
    yield


app = FastAPI(
    title="TubeYou API",
    description="API REST de la plataforma de videos TubeYou (React + FastAPI + Amazon S3 + EC2 + Amazon RDS)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS para permitir peticiones desde la SPA en React (S3 o local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directorio estatico: respaldo local de archivos cuando no hay buckets de S3 configurados
static_dir = Path(src_dir) / "static"
os.makedirs(static_dir / "uploads" / "videos", exist_ok=True)
os.makedirs(static_dir / "uploads" / "thumbnails", exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Registro de routers
app.include_router(user_router)
app.include_router(video_router)
app.include_router(comment_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "TubeYou API funcionando correctamente en Amazon EC2",
        "docs": "/docs",
        "status": "online",
    }
