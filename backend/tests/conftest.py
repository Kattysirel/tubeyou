import os
import sys
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp(prefix="tubeyou-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp) / 'test.db'}"
os.environ["UPLOADS_DIR"] = str(Path(_tmp) / "uploads")
os.environ["STORAGE_BACKEND"] = "local"
os.environ["SECRET_KEY"] = "test-secret"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from src.database.database import Base, engine  # noqa: E402
from src.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth(client):
    client.post("/users", json={"name": "Ana", "email": "ana@test.com", "password": "secret123"})
    data = client.post("/login", json={"email": "ana@test.com", "password": "secret123"}).json()
    return {"headers": {"Authorization": f"Bearer {data['access_token']}"}, "user": data["user"]}


@pytest.fixture()
def upload_files():
    return {
        "video": ("clip.mp4", b"\x00\x00\x00\x18ftypmp42" + b"0" * 100, "video/mp4"),
        "thumbnail": ("thumb.png", b"\x89PNG\r\n\x1a\n" + b"0" * 50, "image/png"),
    }
