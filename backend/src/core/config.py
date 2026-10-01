import os
from urllib.parse import quote_plus

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

# --- Base de datos (Amazon RDS / PostgreSQL) ---
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "tubeyou_db")

ENCODED_PASSWORD = quote_plus(DB_PASSWORD)

# Si DATABASE_URL viene completa en el entorno se usa tal cual; si no, se arma con las variables DB_*
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

# --- Seguridad (JWT) ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tubeyou-clave-de-desarrollo-cambiar-en-produccion")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# --- Amazon S3 ---
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_VIDEOS = os.getenv("S3_BUCKET_VIDEOS", "")
S3_BUCKET_THUMBNAILS = os.getenv("S3_BUCKET_THUMBNAILS", "")

# Solo para pruebas locales sin IAM Role (en la EC2 las credenciales las da el rol)
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Respaldo local (sin buckets configurados): URL publica de esta API para armar los enlaces
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")

# --- Restricciones de archivos ---
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_VIDEO_EXTENSIONS = {".mp4"}
ALLOWED_THUMBNAIL_EXTENSIONS = {".jpg", ".jpeg", ".png"}
