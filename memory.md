<!-- Ruta: /memory.md (raíz del repositorio) -->
# Memoria del proyecto

## Estado actual
- Fase: 3 - Frontend completado (React + Vite + Tailwind CDN); listo para despliegue
- Última herramienta usada: Antigravity

## Hecho
- [x] Nombre (First Step), idea, RF/RNF y ficheros definidos
- [x] Plan del backend aprobado (pasos 1 a 7)
- [x] Paso 1: base del backend (config, database, models, main, requirements, .env.example)
- [x] Paso 2: auth (registro, login, JWT, bcrypt y recompensas por defecto por mascota)
- [x] Paso 3: hábitos (CRUD protegido, borrado lógico y days_of_week ISO)
- [x] requirements.txt fijado a versiones con wheels oficiales para Windows (sin Rust)
- [x] Entorno corregido: venv con CPython 3.11.9 (win-amd64), dependencias instaladas y /health verificado
- [x] Paso 4: marcar/desmarcar hábitos (XP base, bonus de racha y de día perfecto)
- [x] Paso 5: GET /today, GET /week, GET /me, PUT /me/rewards y GET /achievements
- [x] Paso 6: logros automáticos (6 iniciales) y recálculo de xp_total, nivel y racha
- [x] Paso 7: CORS y DATABASE_URL/DB_* desde .env, creación de tablas y seed al arrancar
- [x] Pruebas end-to-end con uvicorn: auth, CRUD, completar/desmarcar, tramos 25/50/75/100,
      bonus +10%/+50%, rachas de 2/10/30 días, borrado lógico y errores 400/401/404
- [x] Datos de prueba eliminados de la BD (0 usuarios, 6 logros cargados)
- [x] Diseño en Stitch analizado e integrado (LoginRegister, Home, My Habits)
- [x] Frontend (React + Vite + Tailwind CDN) completado en /frontend:
      - index.html con CDN de Tailwind y configuración de colores/fuentes de Stitch
      - Cliente API en src/api.js con JWT, variables de entorno y manejo de errores 401
      - Componente LoginRegister (inicio de sesión / registro con selección de Luna/Buster)
      - Componente Today (HUD de jugador, medidor de XP de 10 segmentos, escalera SVG dinámica con mascota, checklist de misiones, tarjeta de recompensas y montaña semanal)
      - Componente Habits (alta y edición de misiones, selector de días ISO, eliminación con confirmación de 2 pasos y configuración de recompensas)
      - Componente Profile (expediente de aventurero, cambio de mascota, salón de logros y logout)
      - Componentes Header y Navbar compartidos
      - Build verificado y optimizado (`npm run build` exitoso)

## Pendiente
- [ ] Despliegue (Vercel + Render)
- [ ] README final del repositorio

## Decisiones tomadas
- Login real con JWT
- Solo escalera diaria y semanal (mensual y anual descartadas)
- Mascota: perro o gato, elegida al registrarse y editable desde el perfil
- Recompensas personalizadas por tramo (25/50/75/100%), por % de hábitos cumplidos
- Dificultad por hábito (afecta XP), sin dificultad global
- Nivel lineal: 100 XP por nivel
- Paleta azul, morado y negro
- "Hoy" con APP_TIMEZONE (default America/Bogota) y today_local(); nunca la hora UTC del servidor
- days_of_week en ISO (1 = lunes ... 7 = domingo); vacío se rechaza con 400
- created_at en UTC; se convierte a APP_TIMEZONE solo al comparar fechas
- Borrado lógico con habits.deleted_at; las completions se conservan
- Racha solo cuenta días al 100%; se recalcula (no se incrementa)
- Bonus de racha semanal: +10% cada 7 días, tope +50%
- Tabla day_bonuses para el día perfecto (+20); xp_total = suma de completions + day_bonuses
- En Windows usar `py` con venv; el `python` del PATH es Inkscape (MinGW) y no puede usar wheels win_amd64. Instalar con `--only-binary=:all:`
- config.py acepta DATABASE_URL o DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME, y fuerza `postgresql+psycopg2://` (SQLAlchemy 2.1 usa psycopg3 por defecto)
- JWT HS256 con `sub` = id de usuario y expiración de 7 días (`ACCESS_TOKEN_EXPIRE_MINUTES`)
- Contraseñas con bcrypt directo (sin passlib); máximo 72 bytes por límite de bcrypt
- La API expone days_of_week como lista de enteros; en BD sigue siendo la cadena ISO
- Recompensas por defecto: perro y gato usan "Hueso" / "Lata de atún" en los 4 tramos
- Si hoy no está al 100%, la racha se cuenta desde ayer (el día aún no terminó);
  los días sin hábitos no suman ni rompen la racha
- GET /today, /week, /me y /achievements recalculan racha/XP y desbloquean logros
  para que el estado sea correcto tras el cambio de día
- Desmarcar devuelve deltas negativos en xp_earned/day_bonus_xp y retira el bonus del día
- Errores de validación de Pydantic se devuelven como 400 con detalle claro (RNF-05)
- Sin `tzdata` en Windows, respaldo de offset fijo para zonas latinoamericanas
  habituales (America/Bogota = UTC-5); instalarlo es opcional
- Frontend construido con React 18 + Vite 5 sin dependencias npm de Tailwind; Tailwind se carga vía CDN en index.html preservando la configuración completa de Stitch (fuentes Space Grotesk / Plus Jakarta Sans, colores y tokens).
- Navegación SPA por pestañas (Hoy, Hábitos, Perfil) en sincronía con el Navbar inferior flotante de Stitch.
- Escalera interactiva en SVG con mascota pixel art (Luna o Buster) que sube escalón por escalón según los hábitos completados del día.

## Problemas abiertos
- `tzdata` no está instalado en el venv: en Windows solo funciona el respaldo de
  offset fijo (suficiente para America/Bogota). Si se necesita otra zona con
  horario de verano, instalar `tzdata`.
