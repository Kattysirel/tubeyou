from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.crud import user as user_crud
from src.database.connection import get_db
from src.schemas.user import LoginResponse, UserCreate, UserLogin, UserRead
from src.security.jwt import create_access_token

router = APIRouter(tags=["Usuarios"])


def _to_read(db: Session, user) -> UserRead:
    return UserRead(
        id=user.id,
        name=user.name,
        email=user.email,
        video_count=user_crud.count_videos(db, user.id),
    )


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if user_crud.get_by_email(db, data.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo")
    return _to_read(db, user_crud.create(db, data))


@router.post("/login", response_model=LoginResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = user_crud.authenticate(db, data.email, data.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contrasena incorrectos")
    return LoginResponse(access_token=create_access_token(user.id), user=_to_read(db, user))


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = user_crud.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return _to_read(db, user)
