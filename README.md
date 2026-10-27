<!-- Ruta: /README.md (raíz del repositorio) -->
# First Step 

Sube un escalón cada día. Convierte tus hábitos en una escalera que tu mascota
pixel art va subiendo: gana XP, sube de nivel, mantén tu racha y date las
recompensas que tú mismo elijas.

🔗 **Demo en vivo:** (pendiente)

## Tecnologías
React, Vite, Tailwind, FastAPI, PostgreSQL, JWT.

## Diseño con Stitch
Capturas y prompts en /docs/stitch.

## Instalación local
### Backend
1. cd backend
2. pip install -r requirements.txt
3. Copiar .env.example a .env y completar las variables
4. uvicorn main:app --reload

### Frontend
1. cd frontend
2. npm install
3. Copiar .env.example a .env y completar la URL de la API
4. npm run dev

## Variables de entorno
- DATABASE_URL, SECRET_KEY (backend)
- VITE_API_URL (frontend)

## Uso
Regístrate, elige tu mascota, crea tus hábitos y márcalos cada día.
Configura tus recompensas en ajustes.

## Equipo
Samuel Esteban Molina Diaz