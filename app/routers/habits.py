"""Rutas de hábitos y de marcar/desmarcar (RF-04, RF-06)."""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Completion, Habit, User
from app.schemas import (
    AchievementOut,
    CompletionOut,
    HabitCreate,
    HabitOut,
    HabitUpdate,
)
from app.services.achievements import check_achievements
from app.services.progress import (
    habit_applies_on,
    level_for,
    progress_for,
    recalculate_user_progress,
    sync_day_bonus,
    today_local,
    xp_for_habit,
)
from app.utils import format_days_of_week

router = APIRouter(prefix="/habits", tags=["habits"])


def _get_active_habit(db: Session, user: User, habit_id: int) -> Habit:
    habit = db.scalar(
        select(Habit).where(
            Habit.id == habit_id,
            Habit.user_id == user.id,
            Habit.deleted_at.is_(None),
        )
    )
    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hábito no encontrado"
        )
    return habit


def _validate_days(days_of_week) -> str:
    """Normaliza los días ISO; un hábito sin días se rechaza con 400."""
    try:
        return format_days_of_week(days_of_week)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


def _completion_response(
    db: Session,
    user: User,
    day: date,
    xp_earned: int,
    day_bonus_xp: int,
    unlocked: list,
) -> CompletionOut:
    progress = progress_for(db, user, day)
    return CompletionOut(
        date=day,
        xp_earned=xp_earned,
        day_bonus_xp=day_bonus_xp,
        xp_total=user.xp_total,
        level=level_for(user.xp_total),
        current_streak=user.current_streak,
        unlocked_achievements=[
            AchievementOut(
                code=achievement.code,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                unlocked=True,
            )
            for achievement in unlocked
        ],
        **progress,
    )


@router.get("", response_model=list[HabitOut])
def list_habits(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Habit]:
    """Lista los hábitos activos del usuario (RF-04)."""
    return list(
        db.scalars(
            select(Habit)
            .where(Habit.user_id == user.id, Habit.deleted_at.is_(None))
            .order_by(Habit.id)
        )
    )


@router.post("", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(
    payload: HabitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Habit:
    """Crea un hábito (RF-04)."""
    habit = Habit(
        user_id=user.id,
        name=payload.name,
        difficulty=payload.difficulty,
        icon=payload.icon,
        days_of_week=_validate_days(payload.days_of_week),
    )
    db.add(habit)
    db.flush()

    # Crear hábitos puede desbloquear "Coleccionista" (RF-15).
    recalculate_user_progress(db, user)
    check_achievements(db, user)
    db.commit()
    db.refresh(habit)
    return habit


@router.put("/{habit_id}", response_model=HabitOut)
def update_habit(
    habit_id: int,
    payload: HabitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Habit:
    """Edita un hábito del usuario (RF-04)."""
    habit = _get_active_habit(db, user, habit_id)

    data = payload.model_dump(exclude_unset=True)
    # Un null explicito no debe borrar campos obligatorios del hábito.
    data = {field: value for field, value in data.items() if value is not None}
    if "days_of_week" in data:
        data["days_of_week"] = _validate_days(data["days_of_week"])

    for field, value in data.items():
        setattr(habit, field, value)

    db.flush()

    # Cambiar los días puede afectar la racha y el % de hoy.
    sync_day_bonus(db, user, today_local())
    recalculate_user_progress(db, user)
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    """Borra un hábito con borrado lógico; las completions se conservan."""
    habit = _get_active_habit(db, user, habit_id)
    habit.deleted_at = datetime.now(timezone.utc)
    db.flush()

    # Al dejar de aplicar hoy puede alcanzarse el 100% (bonus de día perfecto).
    sync_day_bonus(db, user, today_local())
    recalculate_user_progress(db, user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{habit_id}/complete", response_model=CompletionOut)
def complete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CompletionOut:
    """Marca el hábito como cumplido hoy y suma XP (RF-06, RF-07, RF-08)."""
    habit = _get_active_habit(db, user, habit_id)
    today = today_local()

    if not habit_applies_on(habit, today):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este hábito no aplica hoy",
        )

    existing = db.scalar(
        select(Completion).where(
            Completion.habit_id == habit.id, Completion.date == today
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste este hábito hoy",
        )

    # Se pone la racha al día antes de calcular el bonus.
    recalculate_user_progress(db, user)
    xp_earned, _ = xp_for_habit(habit, user)

    db.add(
        Completion(
            habit_id=habit.id,
            user_id=user.id,
            date=today,
            xp_earned=xp_earned,
        )
    )
    db.flush()

    bonus = sync_day_bonus(db, user, today)
    recalculate_user_progress(db, user)
    unlocked = check_achievements(db, user)
    db.commit()

    return _completion_response(db, user, today, xp_earned, bonus, unlocked)


@router.delete("/{habit_id}/complete", response_model=CompletionOut)
def uncomplete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CompletionOut:
    """Desmarca el hábito de hoy y retira su XP (RF-06)."""
    habit = _get_active_habit(db, user, habit_id)
    today = today_local()

    completion = db.scalar(
        select(Completion).where(
            Completion.habit_id == habit.id, Completion.date == today
        )
    )
    if completion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este hábito no está marcado como cumplido hoy",
        )

    removed_xp = completion.xp_earned
    db.delete(completion)
    db.flush()

    bonus = sync_day_bonus(db, user, today)
    recalculate_user_progress(db, user)
    db.commit()

    return _completion_response(db, user, today, -removed_xp, bonus, [])
