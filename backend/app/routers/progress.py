"""Rutas del panel "Hoy" y de la escalera semanal (RF-05, RF-11, RF-12, RF-14)."""

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Completion, Habit, User
from app.schemas import HabitOut, TodayHabitOut, TodayOut, WeekDayOut, WeekOut
from app.services.progress import (
    bucket_for,
    days_stats,
    habit_applies_on,
    level_for,
    percent_for,
    progress_for,
    recalculate_user_progress,
    today_local,
)

router = APIRouter(tags=["progress"])


@router.get("/today", response_model=TodayOut)
def get_today(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> TodayOut:
    """Hábitos que aplican hoy, % cumplido y recompensa actual (RF-05, RF-14)."""
    today = today_local()

    # Se recalcula la racha para reflejar el cambio de día.
    recalculate_user_progress(db, user)
    db.commit()

    habits = [
        habit
        for habit in db.scalars(
            select(Habit)
            .where(Habit.user_id == user.id, Habit.deleted_at.is_(None))
            .order_by(Habit.id)
        )
        if habit_applies_on(habit, today)
    ]

    completed = {
        completion.habit_id: completion.date
        for completion in db.scalars(
            select(Completion).where(
                Completion.user_id == user.id, Completion.date == today
            )
        )
    }

    progress = progress_for(db, user, today)
    today_habits = [
        TodayHabitOut(
            **HabitOut.model_validate(habit).model_dump(),
            completed=habit.id in completed,
            completed_date=completed.get(habit.id),
        )
        for habit in habits
    ]

    return TodayOut(
        date=today,
        xp_total=user.xp_total,
        level=level_for(user.xp_total),
        current_streak=user.current_streak,
        habits=today_habits,
        **progress,
    )


@router.get("/week", response_model=WeekOut)
def get_week(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> WeekOut:
    """Los 7 días de la semana actual con su % cumplido (RF-12)."""
    today = today_local()
    week_start = today - timedelta(days=today.isoweekday() - 1)
    week_end = week_start + timedelta(days=6)

    recalculate_user_progress(db, user)
    db.commit()

    stats = days_stats(db, user.id, week_start, week_end)

    days = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        total, completed = stats.get(day, (0, 0))
        percent = percent_for(completed, total)
        days.append(
            WeekDayOut(
                date=day,
                weekday=day.isoweekday(),
                total=total,
                completed=completed,
                percent=percent,
                bucket=bucket_for(percent),
                is_today=day == today,
            )
        )

    return WeekOut(week_start=week_start, week_end=week_end, days=days)
