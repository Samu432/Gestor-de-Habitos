"""Rutas de autenticación (RF-01, RF-02, RF-03)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

# Recompensas por defecto según la mascota (RF-13).
DEFAULT_REWARDS = {
    "dog": "Hueso",
    "cat": "Lata de atún",
}


def _build_token(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    """Registra al usuario y devuelve el token (RF-01, RF-03)."""
    email = str(payload.email).lower()

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )

    default_reward = DEFAULT_REWARDS[payload.pet]
    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        pet=payload.pet,
        reward_25=default_reward,
        reward_50=default_reward,
        reward_75=default_reward,
        reward_100=default_reward,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )

    db.refresh(user)
    return _build_token(user)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    """Inicia sesión con correo y contraseña (RF-02)."""
    email = str(payload.email).lower()
    user = db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _build_token(user)
