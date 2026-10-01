from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.security import create_access_token
from crud.user_crud import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    to_user_read,
)
from database.database import get_session
from schemas.user_schema import Token, UserCreate, UserLogin, UserRead

router = APIRouter(tags=["Usuarios"])


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(data: UserCreate, session: Session = Depends(get_session)):
    if get_user_by_email(session, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo",
        )
    return to_user_read(session, create_user(session, data))


@router.post("/login", response_model=Token)
def login(data: UserLogin, session: Session = Depends(get_session)):
    user = authenticate_user(session, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": to_user_read(session, user)}


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return to_user_read(session, user)
