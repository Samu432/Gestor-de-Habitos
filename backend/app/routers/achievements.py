"""Ruta del catálogo de logros (RF-16)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import AchievementOut
from app.services.achievements import achievement_status, check_achievements
from app.services.progress import recalculate_user_progress

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
def list_achievements(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[AchievementOut]:
    """Todos los logros con su estado para el usuario (RF-16)."""
    recalculate_user_progress(db, user)
    check_achievements(db, user)
    db.commit()
    return [
        AchievementOut(**status) for status in achievement_status(db, user)
    ]
