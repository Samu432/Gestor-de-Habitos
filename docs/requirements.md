<!-- Ruta: /docs/requirements.md -->
# First Step — Requisitos

## Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-01 | El usuario puede registrarse con nombre, correo y contraseña |
| RF-02 | El usuario puede iniciar y cerrar sesión |
| RF-03 | Al registrarse, el usuario elige su mascota: perro o gato |
| RF-04 | El usuario puede crear, ver, editar y eliminar hábitos (nombre, dificultad, ícono y días de la semana en que aplica) |
| RF-05 | El panel "Hoy" muestra solo los hábitos que aplican ese día |
| RF-06 | El usuario puede marcar un hábito como cumplido una vez por día, y desmarcarlo si se equivocó |
| RF-07 | El sistema suma XP al cumplir un hábito según su dificultad (fácil 10, media 20, difícil 30) |
| RF-08 | El sistema aplica un bonus de XP por racha y otro por día perfecto (100%) |
| RF-09 | El sistema calcula el nivel a partir del XP total |
| RF-10 | El sistema lleva la racha de días consecutivos y la reinicia si se falla un día |
| RF-11 | La escalera diaria muestra un escalón por hábito del día, y la mascota pixel art sube un escalón al cumplir cada hábito |
| RF-12 | La escalera semanal muestra un escalón por día de la semana, con un tono de color según el % de hábitos cumplidos (0, 25, 50, 75 o 100) |
| RF-13 | El usuario puede definir su recompensa personalizada para 100%, 75%, 50% y 25%, con valores por defecto según la mascota |
| RF-14 | El panel "Hoy" muestra la recompensa que va ganando en tiempo real según el % cumplido |
| RF-15 | El sistema desbloquea logros automáticamente al cumplir sus condiciones |
| RF-16 | El usuario ve su perfil con nivel, XP, racha y logros (desbloqueados y bloqueados) |

## Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | La interfaz es responsiva (móvil y escritorio) y sigue la paleta azul, morado y negro |
| RNF-02 | Las contraseñas se guardan con hash (bcrypt) y la sesión usa JWT |
| RNF-03 | Los datos persisten en PostgreSQL, sin arreglos en memoria |
| RNF-04 | Las claves y la conexión a la BD van en variables de entorno, nunca en el cliente |
| RNF-05 | La API valida los datos y devuelve errores claros (400, 401, 404) |
| RNF-06 | El XP, el nivel, la racha, los logros y el % del día se calculan en el servidor |
| RNF-07 | La app está desplegada en una URL pública, sin errores de CORS |
| RNF-08 | Las respuestas de la API tardan menos de 1 segundo en condiciones normales |
| RNF-09 | La animación de la mascota es fluida y no bloquea la interfaz |