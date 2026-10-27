"""Esquemas de entrada y salida de la API (validación, RNF-05)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, field_validator

from app.constants import XP_BASE
from app.utils import parse_days_of_week

Pet = Literal["dog", "cat"]
Difficulty = Literal["easy", "medium", "hard"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------- Autenticación


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    pet: Pet = "dog"

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return cleaned

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def check_password_bytes(cls, value: str) -> str:
        # bcrypt solo admite 72 bytes.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes")
        return value


class LoginIn(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserOut(ORMModel):
    id: int
    name: str
    email: EmailStr
    pet: Pet
    xp_total: int
    current_streak: int
    last_completed_date: date | None = None
    reward_25: str
    reward_50: str
    reward_75: str
    reward_100: str

    @computed_field
    @property
    def level(self) -> int:
        # Nivel = xp_total // 100 + 1 (RF-09).
        return self.xp_total // 100 + 1


class AchievementOut(ORMModel):
    code: str
    name: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: datetime | None = None


class MeOut(UserOut):
    achievements: list[AchievementOut] = Field(default_factory=list)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RewardsUpdate(BaseModel):
    pet: Pet | None = None
    reward_25: str | None = Field(default=None, min_length=1, max_length=120)
    reward_50: str | None = Field(default=None, min_length=1, max_length=120)
    reward_75: str | None = Field(default=None, min_length=1, max_length=120)
    reward_100: str | None = Field(default=None, min_length=1, max_length=120)


# -------------------------------------------------------------------- Hábitos


class HabitCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    difficulty: Difficulty = "easy"
    icon: str = Field(default="✅", min_length=1, max_length=40)
    days_of_week: list[int] | str

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return cleaned


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    difficulty: Difficulty | None = None
    icon: str | None = Field(default=None, min_length=1, max_length=40)
    days_of_week: list[int] | str | None = None


class HabitOut(ORMModel):
    id: int
    name: str
    difficulty: Difficulty
    icon: str
    days_of_week: list[int]

    @field_validator("days_of_week", mode="before")
    @classmethod
    def parse_days(cls, value: str | list[int]) -> list[int]:
        return parse_days_of_week(value)

    @computed_field
    @property
    def xp_base(self) -> int:
        return XP_BASE.get(self.difficulty, XP_BASE["easy"])


class TodayHabitOut(HabitOut):
    completed: bool = False
    completed_date: date | None = None


# ------------------------------------------------------------------- Progreso


class ProgressOut(BaseModel):
    total: int
    completed: int
    percent: int
    bucket: int
    reward: str | None = None


class TodayOut(ProgressOut):
    date: date
    xp_total: int
    level: int
    current_streak: int
    habits: list[TodayHabitOut]


class WeekDayOut(BaseModel):
    date: date
    weekday: int
    total: int
    completed: int
    percent: int
    bucket: int
    is_today: bool = False


class WeekOut(BaseModel):
    week_start: date
    week_end: date
    days: list[WeekDayOut]


class CompletionOut(ProgressOut):
    """Resultado de marcar o desmarcar un hábito.

    xp_earned y day_bonus_xp son el delta: negativos al desmarcar.
    """

    date: date
    xp_earned: int
    day_bonus_xp: int
    xp_total: int
    level: int
    current_streak: int
    unlocked_achievements: list[AchievementOut] = Field(default_factory=list)
