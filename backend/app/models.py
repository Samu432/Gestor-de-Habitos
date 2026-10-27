"""Modelos de datos de First Step (RNF-03)."""

from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow() -> datetime:
    """Fecha y hora actual en UTC (created_at se guarda siempre en UTC)."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("pet IN ('dog', 'cat')", name="ck_users_pet"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    pet: Mapped[str] = mapped_column(String(10), nullable=False, default="dog")

    xp_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Recompensas personalizadas por tramo de % cumplido (RF-13).
    reward_25: Mapped[str] = mapped_column(String(120), nullable=False, default="Hueso")
    reward_50: Mapped[str] = mapped_column(String(120), nullable=False, default="Hueso")
    reward_75: Mapped[str] = mapped_column(String(120), nullable=False, default="Hueso")
    reward_100: Mapped[str] = mapped_column(String(120), nullable=False, default="Hueso")


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(10), nullable=False, default="easy")
    icon: Mapped[str] = mapped_column(String(40), nullable=False, default="✅")

    # Días ISO en que aplica, por ejemplo "1,2,3,4,5".
    days_of_week: Mapped[str] = mapped_column(String(20), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    # Borrado lógico: deja de aplicar desde ese día, las completions se conservan.
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "difficulty IN ('easy', 'medium', 'hard')", name="ck_habits_difficulty"
        ),
    )


class Completion(Base):
    __tablename__ = "completions"
    __table_args__ = (
        UniqueConstraint("habit_id", "date", name="uq_completions_habit_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False)
    icon: Mapped[str] = mapped_column(String(40), nullable=False, default="🏅")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class DayBonus(Base):
    __tablename__ = "day_bonuses"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_day_bonuses_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
