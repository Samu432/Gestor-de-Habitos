"""Rutas del perfil y de las recompensas (RF-13, RF-16)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import AchievementOut, MeOut, RewardsUpdate, UserOut
from app.services.achievements import achievement_status, check_achievements
from app.services.progress import recalculate_user_progress

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeOut)
def get_me(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> MeOut:
    """Perfil con nivel, XP, racha y logros (RF-16)."""
    recalculate_user_progress(db, user)
    # Los logros se desbloquean automáticamente al cumplir sus condiciones.
    check_achievements(db, user)
    db.commit()

    profile = MeOut.model_validate(user)
    profile.achievements = [
        AchievementOut(**status) for status in achievement_status(db, user)
    ]
    return profile


@router.put("/rewards", response_model=UserOut)
def update_rewards(
    payload: RewardsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    """Edita mascota y recompensas personalizadas por tramo (RF-13)."""
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
