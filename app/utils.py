"""Utilidades compartidas (días de la semana en ISO: 1 = lunes ... 7 = domingo)."""

from __future__ import annotations

from collections.abc import Iterable


def parse_days_of_week(value: str | Iterable[int]) -> list[int]:
    """Normaliza los días a una lista ordenada de enteros entre 1 y 7.

    Acepta tanto la cadena que se guarda en la BD ("1,2,3") como listas.
    Lanza ValueError con un mensaje claro si el valor no es válido.
    """
    if isinstance(value, str):
        parts = [part.strip() for part in value.split(",") if part.strip()]
        try:
            days = [int(part) for part in parts]
        except ValueError as exc:
            raise ValueError(
                "Los días deben ser números del 1 (lunes) al 7 (domingo)"
            ) from exc
    elif isinstance(value, Iterable):
        try:
            days = [int(day) for day in value]
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Los días deben ser números del 1 (lunes) al 7 (domingo)"
            ) from exc
    else:
        raise ValueError("Formato de días inválido")

    if not days:
        raise ValueError("Elige al menos un día de la semana")

    if any(day < 1 or day > 7 for day in days):
        raise ValueError("Los días deben estar entre 1 (lunes) y 7 (domingo)")

    return sorted(set(days))


def format_days_of_week(days: str | Iterable[int]) -> str:
    """Convierte los días al formato que se guarda en habits.days_of_week."""
    return ",".join(str(day) for day in parse_days_of_week(days))
