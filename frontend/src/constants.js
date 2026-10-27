// Constantes y recursos visuales para First Step

export const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB_fbI5XwCclSIycRZKFQQGEs7-thjUgitV3k7aCvPOu2dLXGFvWFA8ChV2FscdyiATOMW9cmXYKlEXxBL38H_NjnO2uQmMH3yqCfPVmus_klHtypWK4y8m2B4mt0H3jtqieip6b3wGKY_dos6ytzRyyWxBwe8IZsUru03XjdG4KETyrGq8-0d_jiX4tiwCn2mybeqWpxxremlpRTlkIPblLVJp8Wym24BLtisu7lrJiN_A9lBss6rf5w';

export const PETS = {
  cat: {
    id: 'cat',
    name: 'Luna',
    label: 'Gata Luna',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB5BVk1N_vq-J9iBAe5lIFH7ZGJ0Uicl44PCHC8bdb9VdrTzLP5_7eb5QeeN7f1J7BqVVo5-z90HVToR6CZ5ZcZ_Ryjw9NLBytnDFK6dnfQC4NeMPpzY4ebOmV4U5DJBWIPa4sXi9x3BVn-NGCGXweA4lD1UM1LdBwpaqcQq8Tpq4KXL3Y4J9h47A4IIj1fkTFDt1EfkNku9TRW9tqPZxKStKX8qN0y2a80lU4jCsuZ1Ku0RfDL7drobQ',
    defaultReward: 'Lata de atún',
  },
  dog: {
    id: 'dog',
    name: 'Buster',
    label: 'Perro Buster',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYLIT4_IM5uODZHSLdHxTVnIUlUElXbrgil-Mtv9YF0F31i5oBfCjKHnZhu4qjCftCPJzZR6-TSdjQU7YVRaG131EX71mWEBoDlbdx2j9rWd9J7PRI66jW5PdqTh9PQVREWwcc-ElAeIE3Ic3anHnt1ZKAT1Xfj1HJWVo6U65ZzrV-kDobgaSQePxTb7pPcKKOK-eGlNisni_G6Inj0WSSh0M_dzEimloWi66jhNCFxrWNO1CUoJvnjQ',
    defaultReward: 'Hueso',
  },
};

export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Fácil',
    xp: 10,
    colorClass: 'text-tertiary',
    bgClass: 'bg-tertiary-container/30',
    rank: 'Rango 1',
  },
  medium: {
    label: 'Medio',
    xp: 20,
    colorClass: 'text-secondary',
    bgClass: 'bg-secondary-container/40',
    rank: 'Recomendado',
  },
  hard: {
    label: 'Difícil',
    xp: 30,
    colorClass: 'text-error',
    bgClass: 'bg-error-container/40',
    rank: 'Rango Jefe',
  },
};

// Días de la semana en formato ISO (1 = lunes ... 7 = domingo)
export const DAYS_OF_WEEK = [
  { iso: 1, label: 'L', short: 'Lun', name: 'Lunes' },
  { iso: 2, label: 'M', short: 'Mar', name: 'Martes' },
  { iso: 3, label: 'X', short: 'Mié', name: 'Miércoles' },
  { iso: 4, label: 'J', short: 'Jue', name: 'Jueves' },
  { iso: 5, label: 'V', short: 'Vie', name: 'Viernes' },
  { iso: 6, label: 'S', short: 'Sáb', name: 'Sábado' },
  { iso: 7, label: 'D', short: 'Dom', name: 'Domingo' },
];

export const ICONS_CATALOG = [
  { icon: 'water_drop', label: 'Agua' },
  { icon: 'menu_book', label: 'Libro' },
  { icon: 'fitness_center', label: 'Gimnasio' },
  { icon: 'code', label: 'Código' },
  { icon: 'favorite', label: 'Salud' },
  { icon: 'dark_mode', label: 'Sueño' },
  { icon: 'nutrition', label: 'Dieta' },
  { icon: 'music_note', label: 'Música' },
  { icon: 'self_improvement', label: 'Zen' },
  { icon: 'directions_run', label: 'Correr' },
  { icon: 'brush', label: 'Arte' },
  { icon: 'savings', label: 'Ahorro' },
];

