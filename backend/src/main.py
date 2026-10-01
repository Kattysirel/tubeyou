import sys
from pathlib import Path

# Asegura que src/ este en sys.path: asi `cd src && fastapi run` (PM2) resuelve los modulos
# igual en local y en la EC2.
SRC_DIR = str(Path(__file__).resolve().parent)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from core.config import settings  # noqa: E402
from database.database import Base, engine  # noqa: E402
from models import comment_model, user_model, video_model  # noqa: E402, F401  (registra las tablas)
from routers import comment_router, user_router, video_router  # noqa: E402

# Crea las tablas en RDS / PostgreSQL (o SQLite en local) al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TubeYou API",
    description="API de la plataforma de videos TubeYou (FastAPI + PostgreSQL + S3).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router.router)
app.include_router(video_router.router)
app.include_router(comment_router.router)

if settings.STORAGE_BACKEND == "local":
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")


@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok"}
