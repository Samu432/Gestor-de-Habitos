"""Logros: catálogo inicial y desbloqueo automático (RF-15, RF-16)."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Achievement, Completion, Habit, User, UserAchievement

# Catálogo inicial que se carga al arrancar la aplicación.
ACHIEVEMENTS_SEED = [
    {
        "code": "first_step",
        "name": "Primer paso",
        "description": "Cumple tu primer hábito",
        "icon": "👣",
    },
    {
        "code": "constant",
        "name": "Constante",
        "description": "Alcanza una racha de 7 días",
        "icon": "🔥",
    },
    {
        "code": "unstoppable",
        "name": "Imparable",
        "description": "Alcanza una racha de 30 días",
        "icon": "🚀",
    },
    {
        "code": "collector",
        "name": "Coleccionista",
        "description": "Crea 5 hábitos",
        "icon": "🗂️",
    },
    {
        "code": "veteran",
        "name": "Veterano",
        "description": "Completa 50 hábitos",
        "icon": "🎖️",
    },
    {
        "code": "level_5",
        "name": "Nivel 5",
        "description": "Alcanza el nivel 5",
        "icon": "⭐",
    },
]


def seed_achievements(db: Session) -> None:
    """Inserta los logros que falten (idempotente)."""
    existing = set(db.scalars(select(Achievement.code)))
    for item in ACHIEVEMENTS_SEED:
        if item["code"] not in existing:
            db.add(Achievement(**item))
    db.commit()


def all_achievements(db: Session) -> list[Achievement]:
    return list(db.scalars(select(Achievement).order_by(Achievement.id)))


def unlocked_map(db: Session, user_id: int) -> dict[int, datetime]:
    rows = db.scalars(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    return {row.achievement_id: row.unlocked_at for row in rows}


def achievement_status(db: Session, user: User) -> list[dict]:
    """Todas las logros con su estado (desbloqueado o no) para el usuario."""
    unlocked = unlocked_map(db, user.id)
    return [
        {
            "code": achievement.code,
            "name": achievement.name,
            "description": achievement.description,
            "icon": achievement.icon,
            "unlocked": achievement.id in unlocked,
            "unlocked_at": unlocked.get(achievement.id),
        }
        for achievement in all_achievements(db)
    ]


def check_achievements(
    db: Session, user: User, today: date | None = None
) -> list[Achievement]:
    """Desbloquea los logros cumplidos y devuelve los nuevos."""
    from app.services.progress import level_for, today_local

    today = today or today_local()

    completions_count = db.scalar(
        select(func.count(Completion.id)).where(Completion.user_id == user.id)
    ) or 0
    habits_created = db.scalar(
        select(func.count(Habit.id)).where(Habit.user_id == user.id)
    ) or 0
    level = level_for(user.xp_total)

    conditions = {
        "first_step": completions_count >= 1,
        "constant": user.current_streak >= 7,
        "unstoppable": user.current_streak >= 30,
        "collector": habits_created >= 5,
        "veteran": completions_count >= 50,
        "level_5": level >= 5,
    }

    already_unlocked = unlocked_map(db, user.id)
    newly_unlocked: list[Achievement] = []

    for achievement in all_achievements(db):
        if (
            conditions.get(achievement.code, False)
            and achievement.id not in already_unlocked
        ):
            db.add(
                UserAchievement(
                    user_id=user.id,
                    achievement_id=achievement.id,
                    unlocked_at=datetime.now(timezone.utc),
                )
            )
            newly_unlocked.append(achievement)

    if newly_unlocked:
        db.flush()

    return newly_unlocked
