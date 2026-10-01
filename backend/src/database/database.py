from sqlmodel import Session, SQLModel, create_engine

from core.config import DATABASE_URL

# SQLite para pruebas locales o PostgreSQL para Amazon RDS
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine_kwargs = {} if DATABASE_URL.startswith("sqlite") else {"pool_pre_ping": True}

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)


def create_database():
    """Crea las tablas users, videos y comments si no existen."""
    global engine
    # Importar los modelos registra las tablas en SQLModel.metadata
    from models.comment_model import Comment  # noqa: F401
    from models.user_model import User  # noqa: F401
    from models.video_model import Video  # noqa: F401

    try:
        SQLModel.metadata.create_all(engine)
        print(f"[DATABASE] Conectada ({DATABASE_URL.split('@')[-1]})")
    except Exception as error:
        print(f"[DATABASE] No se pudo conectar a PostgreSQL ({error}).")
        if not DATABASE_URL.startswith("sqlite"):
            print("[DATABASE] Usando SQLite local (dev_local.db) para desarrollo.")
            engine = create_engine("sqlite:///./dev_local.db", connect_args={"check_same_thread": False})
            SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
