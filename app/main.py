"""Punto de entrada de la API de First Step.

Al arrancar crea las tablas (si no existen) y carga los logros iniciales.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registra los modelos en Base.metadata)
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import achievements, auth, habits, progress, users
from app.services.achievements import seed_achievements


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al arrancar (RNF-03) y cargar el catálogo de logros.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_achievements(db)
    yield


app = FastAPI(
    title="First Step API",
    description="API de hábitos con XP, niveles, rachas, logros y recompensas.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configurado desde el .env (RNF-07).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(progress.router)
app.include_router(users.router)
app.include_router(achievements.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Devuelve 400 con mensajes claros en lugar del 422 por defecto (RNF-05)."""
    errors = []
    for error in exc.errors():
        location = [
            str(part)
            for part in error.get("loc", [])
            if part not in ("body", "query", "path")
        ]
        errors.append(
            {
                "field": ".".join(location) or "body",
                "message": error.get("msg", "Dato inválido"),
            }
        )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": errors},
    )


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root() -> dict:
    return {"name": "First Step API", "version": "1.0.0", "docs": "/docs"}
