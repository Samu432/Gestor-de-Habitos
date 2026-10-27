"""Constantes compartidas de las reglas de progreso (RF-07, RF-08, RF-09)."""

# XP base según la dificultad del hábito.
XP_BASE = {"easy": 10, "medium": 20, "hard": 30}

# Bonus de día perfecto (100%): una vez por día.
PERFECT_DAY_XP = 20

# Bonus de racha: +10% por cada 7 días, con tope de +50%.
STREAK_BONUS_STEP_DAYS = 7
STREAK_BONUS_PER_STEP = 0.10
STREAK_BONUS_MAX_STEPS = 5

# Límite de días hacia atrás al recalcular la racha.
MAX_STREAK_DAYS = 365
