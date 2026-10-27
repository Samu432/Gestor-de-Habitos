# First Step — Backend

API REST de hábitos con XP, niveles, rachas, logros y recompensas.
Stack: FastAPI + SQLAlchemy + PostgreSQL, auth con JWT y bcrypt.

## Requisitos

- Python 3.11+ (el venv del proyecto está en `backend/venv`).
- PostgreSQL con la base `firststep` creada. Las tablas se crean solas al
  arrancar el servidor.

## Configuración

Copia `.env.example` a `.env` y completa los valores:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | URL completa de PostgreSQL. Tiene prioridad sobre las `DB_*`. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión si no usas `DATABASE_URL`. |
| `SECRET_KEY` | Clave para firmar los JWT (obligatoria). |
| `APP_TIMEZONE` | Zona horaria para calcular "hoy" (`America/Bogota` por defecto). |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. |

## Ejecutar el servidor

Desde `backend`, con el venv activo:

```powershell
uvicorn app.main:app --reload
```

Sin activar el venv:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Documentación interactiva: http://127.0.0.1:8000/docs
- Salud: http://127.0.0.1:8000/health

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro con nombre, correo, contraseña y mascota. |
| POST | `/auth/login` | Login; devuelve JWT. |
| GET | `/habits` | Hábitos activos del usuario. |
| POST | `/habits` | Crea un hábito. |
| PUT | `/habits/{id}` | Edita un hábito. |
| DELETE | `/habits/{id}` | Borrado lógico. |
| POST | `/habits/{id}/complete` | Marca como cumplido hoy y suma XP. |
| DELETE | `/habits/{id}/complete` | Desmarca el hábito de hoy. |
| GET | `/today` | Hábitos de hoy, %, recompensa, XP, nivel y racha. |
| GET | `/week` | 7 días de la semana actual con su %. |
| GET | `/me` | Perfil, nivel, racha y logros. |
| PUT | `/me/rewards` | Mascota y recompensas personalizadas. |
| GET | `/achievements` | Catálogo de logros con estado desbloqueado/bloqueado. |

Todas las rutas salvo `/auth/*`, `/health` y `/` requieren
`Authorization: Bearer <token>`.

## Reglas de cálculo

- XP base: fácil 10, media 20, difícil 30.
- Bonus de racha: +10% por cada 7 días, con tope +50%.
- Bonus de día perfecto (100%): +20 XP, una vez por día (`day_bonuses`).
- Nivel = `xp_total // 100 + 1`.
- `xp_total` = suma de `completions.xp_earned` + `day_bonuses.xp`, nunca < 0.
- % del día = cumplidos / hábitos que aplican hoy (solo backend).
- Recompensa: 100% → `reward_100`; ≥75 → `reward_75`; ≥50 → `reward_50`;
  >0 → `reward_25`; 0 → ninguna.
- Racha: días consecutivos al 100%, se recalcula hacia atrás (máx. 365 días).
  Si hoy aún no está al 100%, se cuenta desde ayer. Los días sin hábitos no
  suman ni rompen la racha.
- "Hoy" se calcula con `APP_TIMEZONE` (`today_local()`); nunca con la hora UTC
  del servidor.
- Hábitos eliminados: dejan de aplicar desde el día del borrado, pero sus
  completions se conservan.

## Respuestas útiles para el frontend

- `days_of_week` viaja como lista de enteros ISO (1 = lunes … 7 = domingo),
  aunque en la BD se guarda como `"1,2,3"`.
- Cada día devuelve `percent` (0-100) y `bucket` (0, 25, 50, 75 o 100) para
  pintar los escalones de la escalera.
- Al desmarcar, `xp_earned` y `day_bonus_xp` son deltas negativos.
- Al completar, `unlocked_achievements` trae los logros recién desbloqueados.

## Notas de Windows

- `zoneinfo` necesita el paquete `tzdata` en Windows. Si no está instalado,
  el backend usa un respaldo con offset fijo para las zonas latinoamericanas
  habituales (`America/Bogota` = UTC-5). Instalar `tzdata` es opcional.
- Versiones de dependencias en `requirements.txt`.
