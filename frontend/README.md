# First Step — Frontend

Frontend en React + Vite con estilos cargados vía Tailwind CSS desde CDN en `index.html` (sin dependencias npm de Tailwind), manteniendo fidelidad visual completa a los diseños de Stitch.

## Requisitos previos
- Node.js >= 18
- Backend de FastAPI corriendo (por defecto en `http://localhost:8000`)

## Configuración
1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Ajustar `VITE_API_URL` si el backend está en un puerto o dominio diferente:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

## Instalación y ejecución
```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Componentes principales
- `src/components/LoginRegister.jsx`: Autenticación con selección de compañero (Luna o Buster).
- `src/components/Today.jsx`: Panel "Hoy" con escalera diaria de píxeles, HUD del jugador, misiones de hoy, tarjeta de recompensas y montaña semanal.
- `src/components/Habits.jsx`: CRUD completo de hábitos (dificultad, icono, días de la semana ISO) y configuración de recompensas por tramo (25/50/75/100%).
- `src/components/Profile.jsx`: Expediente del aventurero con nivel, XP, racha, compañero activo y salón de logros desbloqueados/bloqueados.
- `src/components/Header.jsx`: Barra superior persistente con logo, nivel, racha y avatar.
- `src/components/Navbar.jsx`: Barra de navegación inferior flotante.

