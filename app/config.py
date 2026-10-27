"""Configuración leída desde el archivo .env (RNF-04)."""

from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

# El .env vive en la raíz de /backend.
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Opción A: URL completa de PostgreSQL (Supabase, Neon o local).
    database_url: str | None = None

    # Opción B: variables sueltas si no hay DATABASE_URL.
    db_host: str | None = None
    db_port: int = 5432
    db_user: str | None = None
    db_password: str | None = None
    db_name: str | None = None

    # Seguridad: la clave debe venir del .env, nunca escrita en el código.
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # una semana

    # Zona horaria para calcular "hoy".
    app_timezone: str = "America/Bogota"

    # Orígenes permitidos por CORS, separados por coma.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def sqlalchemy_url(self) -> str:
        """Devuelve la URL de conexión forzando el driver psycopg2."""
        if self.database_url:
            url = self.database_url.strip()
            if url.startswith("postgres://"):
                url = "postgresql://" + url[len("postgres://") :]
            if url.startswith("postgresql://"):
                url = "postgresql+psycopg2://" + url[len("postgresql://") :]
            return url

        if not all([self.db_host, self.db_user, self.db_password, self.db_name]):
            raise ValueError(
                "Configura DATABASE_URL o DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME en el .env"
            )

        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        return (
            f"postgresql+psycopg2://{user}:{password}"
            f"@{self.db_host}:{self.db_port}/{quote_plus(self.db_name)}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte la cadena de CORS en una lista limpia."""
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return origins or ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
