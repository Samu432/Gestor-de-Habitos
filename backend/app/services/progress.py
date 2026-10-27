"""Servicios de cálculo de XP, nivel, racha, % del día y recompensas.

Todos los cálculos viven en el backend (RNF-06).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone, tzinfo
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import (
    MAX_STREAK_DAYS,
    PERFECT_DAY_XP,
    STREAK_BONUS_MAX_STEPS,
    STREAK_BONUS_PER_STEP,
    STREAK_BONUS_STEP_DAYS,
    XP_BASE,
)
from app.models import Completion, DayBonus, Habit, User
from app.utils import parse_days_of_week

# Respaldos con offset fijo para Windows sin el paquete tzdata.
_FALLBACK_OFFSETS = {
    "America/Bogota": -5,
    "America/Lima": -5,
    "America/Panama": -5,
    "America/Mexico_City": -6,
    "America/Santiago": -4,
    "America/Argentina/Buenos_Aires": -3,
    "America/Sao_Paulo": -3,
}


def _load_timezone(name: str) -> tzinfo:
    """Carga la zona horaria configurada con respaldo si falta tzdata."""
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError, KeyError):
        offset = _FALLBACK_OFFSETS.get(name)
        if offset is None:
            # Sin base de zonas ni respaldo conocido: se usa UTC.
            return timezone.utc
        return timezone(timedelta(hours=offset), name)


APP_TZ = _load_timezone(settings.app_timezone)


def today_local() -> date:
    """Fecha de "hoy" según APP_TIMEZONE, nunca la hora UTC del servidor."""
    return datetime.now(APP_TZ).date()


def to_local_date(value: datetime) -> date:
    """Convierte un datetime UTC guardado en la BD a fecha local."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(APP_TZ).date()


def level_for(xp_total: int) -> int:
    return max(0, xp_total) // 100 + 1


def habit_applies_on(habit: Habit, day: date) -> bool:
    """Indica si el hábito aplica en un día concreto.

    - No aplica antes de su creación (created_at en UTC -> fecha local).
    - Un hábito eliminado deja de aplicar desde el día del borrado.
    - Solo aplica en sus días ISO (1 = lunes ... 7 = domingo).
    """
    if to_local_date(habit.created_at) > day:
        return False

    if habit.deleted_at is not None and day >= to_local_date(habit.deleted_at):
        return False

    try:
        days = parse_days_of_week(habit.days_of_week)
    except ValueError:
        return False

    return day.isoweekday() in days


def streak_bonus_percent(streak: int) -> int:
    """+10% por cada 7 días de racha, con tope de +50% (RF-08)."""
    steps = min(max(streak, 0) // STREAK_BONUS_STEP_DAYS, STREAK_BONUS_MAX_STEPS)
    return int(steps * STREAK_BONUS_PER_STEP * 100)


def xp_for_habit(habit: Habit, user: User) -> tuple[int, int]:
    """Devuelve (xp total ganado, bonus de racha) para un hábito."""
    base = XP_BASE.get(habit.difficulty, XP_BASE["easy"])
    bonus = round(base * STREAK_BONUS_PER_STEP * min(
        max(user.current_streak, 0) // STREAK_BONUS_STEP_DAYS, STREAK_BONUS_MAX_STEPS
    ))
    return base + bonus, bonus


def percent_for(completed: int, total: int) -> int:
    """% del día = cumplidos / aplicables (0 si no hay hábitos)."""
    if total <= 0:
        return 0
    return int(completed * 100 / total)


def bucket_for(percent: int) -> int:
    """Escalón de color: 0, 25, 50, 75 o 100."""
    if percent >= 100:
        return 100
    return max(0, min(percent, 99) // 25 * 25)


def reward_for(user: User, completed: int, total: int) -> str | None:
    """Recompensa actual según el % cumplido (RF-14)."""
    if total <= 0:
        return None

    percent = percent_for(completed, total)
    if percent >= 100:
        return user.reward_100
    if percent >= 75:
        return user.reward_75
    if percent >= 50:
        return user.reward_50
    if completed > 0:
        return user.reward_25
    return None


def load_habits(db: Session, user_id: int) -> list[Habit]:
    return list(db.scalars(select(Habit).where(Habit.user_id == user_id)))


def completions_by_day(
    db: Session, user_id: int, start: date, end: date
) -> dict[date, set[int]]:
    rows = db.execute(
        select(Completion.date, Completion.habit_id).where(
            Completion.user_id == user_id,
            Completion.date.between(start, end),
        )
    )
    result: dict[date, set[int]] = {}
    for day, habit_id in rows:
        result.setdefault(day, set()).add(habit_id)
    return result


def stats_from(
    habits: list[Habit], completed_ids: dict[date, set[int]], day: date
) -> tuple[int, int]:
    applicable = [habit for habit in habits if habit_applies_on(habit, day)]
    if not applicable:
        return 0, 0
    done = completed_ids.get(day, set())
    completed = sum(1 for habit in applicable if habit.id in done)
    return len(applicable), completed


def day_stats(db: Session, user_id: int, day: date) -> tuple[int, int]:
    habits = load_habits(db, user_id)
    completed_ids = completions_by_day(db, user_id, day, day)
    return stats_from(habits, completed_ids, day)


def days_stats(
    db: Session, user_id: int, start: date, end: date
) -> dict[date, tuple[int, int]]:
    """Estadísticas de un rango de días con una sola consulta de completions."""
    habits = load_habits(db, user_id)
    completed_ids = completions_by_day(db, user_id, start, end)
    result: dict[date, tuple[int, int]] = {}
    cursor = start
    while cursor <= end:
        result[cursor] = stats_from(habits, completed_ids, cursor)
        cursor += timedelta(days=1)
    return result


def compute_streak(db: Session, user_id: int, today: date | None = None) -> int:
    """Recalcula la racha: días consecutivos al 100% hacia atrás (RF-10).

    Si "hoy" todavía no está al 100%, la racha se cuenta desde ayer porque
    el día aún no ha terminado. Los días sin hábitos no suman ni rompen.
    """
    today = today or today_local()
    start = today - timedelta(days=MAX_STREAK_DAYS)
    habits = load_habits(db, user_id)
    completed_ids = completions_by_day(db, user_id, start, today)

    def state(day: date) -> bool | None:
        total, completed = stats_from(habits, completed_ids, day)
        if total == 0:
            return None
        return completed >= total

    streak = 0
    cursor = today if state(today) else today - timedelta(days=1)

    while streak < MAX_STREAK_DAYS and cursor >= start:
        current = state(cursor)
        if current is None:
            cursor -= timedelta(days=1)
            continue
        if not current:
            break
        streak += 1
        cursor -= timedelta(days=1)

    return streak


def recalculate_user_progress(db: Session, user: User) -> None:
    """Recalcula xp_total, racha y última fecha cumplida (nunca baja de 0)."""
    db.flush()

    earned = db.scalar(
        select(func.coalesce(func.sum(Completion.xp_earned), 0)).where(
            Completion.user_id == user.id
        )
    ) or 0
    bonuses = db.scalar(
        select(func.coalesce(func.sum(DayBonus.xp), 0)).where(
            DayBonus.user_id == user.id
        )
    ) or 0

    user.xp_total = max(0, int(earned) + int(bonuses))
    user.current_streak = compute_streak(db, user.id)
    user.last_completed_date = db.scalar(
        select(func.max(Completion.date)).where(Completion.user_id == user.id)
    )
    db.flush()


def sync_day_bonus(db: Session, user: User, day: date) -> int:
    """Otorga o retira el bonus de día perfecto (+20) una vez por día.

    Devuelve el delta de XP aplicado (20, -20 o 0).
    """
    db.flush()
    total, completed = day_stats(db, user.id, day)
    is_perfect = total > 0 and completed >= total

    existing = db.scalar(
        select(DayBonus).where(DayBonus.user_id == user.id, DayBonus.date == day)
    )

    if is_perfect and existing is None:
        db.add(DayBonus(user_id=user.id, date=day, xp=PERFECT_DAY_XP))
        db.flush()
        return PERFECT_DAY_XP

    if not is_perfect and existing is not None:
        xp = existing.xp
        db.delete(existing)
        db.flush()
        return -xp

    return 0


def progress_for(db: Session, user: User, day: date) -> dict:
    """Resumen de progreso de un día (total, %, escalón y recompensa)."""
    total, completed = day_stats(db, user.id, day)
    percent = percent_for(completed, total)
    return {
        "total": total,
        "completed": completed,
        "percent": percent,
        "bucket": bucket_for(percent),
        "reward": reward_for(user, completed, total),
    }
