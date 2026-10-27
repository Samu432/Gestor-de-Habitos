<!-- Ruta: /AGENTS.md (raíz del repositorio) -->
# First Step — Reglas para agentes

## Proyecto
App web de hábitos con estilo videojuego. Una mascota pixel art (perro o gato)
sube una escalera diaria (un escalón por hábito) y una escalera semanal
(un escalón por día, con color según % cumplido). XP, niveles, rachas, logros
y recompensas personalizadas. Hay solo 4 horas: priorizar lo funcional.

## Stack
- Frontend: React + Vite + Tailwind (carpeta /frontend)
- Backend: FastAPI + SQLAlchemy (carpeta /backend)
- BD: PostgreSQL (Supabase o Neon)
- Auth: JWT + bcrypt
- Deploy: Vercel (front) y Render (back)

## Reglas
- Antes de empezar, leer memory.md. Al terminar, actualizarlo.
- Comentarios en español; nombres de variables en inglés.
- XP, nivel, racha, logros y % del día se calculan SOLO en el backend.
- Nunca poner claves en el código: usar .env y mantener .env.example.
- La UI sigue los diseños de Stitch (/docs/stitch) y la paleta de abajo.
- Cambios pequeños. No refactorizar lo que no se pidió.
- No instalar librerías nuevas sin avisar.
- Los requisitos están en /docs/requirements.md. Al implementar, citar el ID (ej. RF-04).
- Días de la semana en ISO (1 = lunes ... 7 = domingo); un hábito sin días se rechaza (400).
- created_at se guarda en UTC y solo se convierte a APP_TIMEZONE al comparar fechas.
- Borrado lógico con habits.deleted_at: un hábito eliminado deja de aplicar desde ese día, pero sus completions se conservan.

## Paleta
- Fondo #0B0B1A, tarjetas #15152B, texto #F1F5F9
- Azul #3B82F6, morado #8B5CF6
- Escalones por %: 0 #2A2A40, 25 #1E3A8A, 50 #3B82F6, 75 #7C3AED, 100 #A855F7 (con glow)

## Modelo de datos
- users: id, name, email, password_hash, pet (dog|cat), xp_total,
  current_streak, last_completed_date,
  reward_25, reward_50, reward_75, reward_100
- habits: id, user_id, name, difficulty (easy|medium|hard), icon,
  days_of_week (ISO, ej. "1,2,3,4,5,6,7"), created_at (UTC), deleted_at (borrado lógico)
- completions: id, habit_id, user_id, date, xp_earned (único por habit_id + date)
- achievements: id, code, name, description, icon
- user_achievements: user_id, achievement_id, unlocked_at
- day_bonuses: id, user_id, date, xp (único por user_id + date)

## Endpoints
- POST /auth/register, POST /auth/login
- GET/POST /habits, PUT/DELETE /habits/{id}
- POST /habits/{id}/complete, DELETE /habits/{id}/complete (desmarcar, fecha de hoy)
- GET /today (hábitos de hoy, % cumplido, recompensa actual)
- GET /week (7 días con su % cumplido)
- GET /me (perfil, nivel, racha), PUT /me/rewards (recompensas y mascota)
- GET /achievements

## Reglas de progreso
- XP base: easy 10, medium 20, hard 30.
- Bonus de racha: +10% por cada 7 días de racha (semanal), tope +50%.
- Bonus de día perfecto (100%): +20 XP una vez por día.
- Nivel = xp_total // 100 + 1
- % del día = hábitos cumplidos / hábitos que aplican hoy.
- Recompensa: 100% -> reward_100; >=75 -> reward_75; >=50 -> reward_50;
  >0 -> reward_25; 0 -> ninguna.
- Recompensas por defecto: perro = hueso, gato = lata de atún (editables).
- Logros: Primer paso (1 cumplido), Constante (racha 7), Imparable (racha 30),
  Coleccionista (5 hábitos creados), Veterano (50 cumplidos), Nivel 5.
- "Hoy" se calcula con APP_TIMEZONE (por defecto America/Bogota) mediante
  today_local() en services/progress.py; nunca con la hora UTC del servidor.
- La racha se recalcula, no se incrementa: cuenta hacia atrás los días
  consecutivos con 100% (máximo 365 días) y se guarda en current_streak.
- xp_total se recalcula como sum(completions.xp_earned) + sum(day_bonuses.xp)
  y nunca baja de 0.