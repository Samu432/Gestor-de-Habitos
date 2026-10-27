import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { DIFFICULTY_CONFIG, DAYS_OF_WEEK, ICONS_CATALOG } from '../constants';

// Pantalla "Hábitos": CRUD de hábitos y configuración de recompensas (RF-04, RF-13)
export default function Habits({ user, onUpdateUser }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado del formulario de creación / edición
  const [editingId, setEditingId] = useState(null);
  const [habitName, setHabitName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedIcon, setSelectedIcon] = useState('menu_book');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Lunes a Viernes por defecto
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario de recompensas
  const [reward25, setReward25] = useState(user?.reward_25 || '');
  const [reward50, setReward50] = useState(user?.reward_50 || '');
  const [reward75, setReward75] = useState(user?.reward_75 || '');
  const [reward100, setReward100] = useState(user?.reward_100 || '');
  const [savingRewards, setSavingRewards] = useState(false);
  const [rewardsSuccess, setRewardsSuccess] = useState(false);

  // Estado de armado para eliminación con confirmación
  const [armedDeleteId, setArmedDeleteId] = useState(null);
  const deleteTimeoutRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (user) {
      setReward25(user.reward_25 || '');
      setReward50(user.reward_50 || '');
      setReward75(user.reward_75 || '');
      setReward100(user.reward_100 || '');
    }
  }, [user]);

  const loadHabits = async () => {
    try {
      setError('');
      const data = await api.getHabits();
      setHabits(data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar hábitos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // Alternar selección de días
  const handleToggleDay = (iso) => {
    setSelectedDays((prev) => {
      if (prev.includes(iso)) {
        if (prev.length === 1) {
          setError('El hábito debe estar asignado al menos a un día');
          return prev;
        }
        return prev.filter((d) => d !== iso);
      } else {
        return [...prev, iso].sort((a, b) => a - b);
      }
    });
  };

  // Enviar formulario de Hábito (Crear o Editar)
  const handleSubmitHabit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) {
      setError('Por favor escribe un objetivo para el hábito');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Debes elegir al menos un día de la semana');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: habitName.trim(),
        difficulty,
        icon: selectedIcon,
        days_of_week: selectedDays,
      };

      if (editingId) {
        await api.updateHabit(editingId, payload);
        setSuccessMsg('¡Hábito actualizado con éxito!');
      } else {
        await api.createHabit(payload);
        setSuccessMsg('¡Hábito añadido a los escalones diarios!');
      }

      // Limpiar formulario
      setEditingId(null);
      setHabitName('');
      setDifficulty('medium');
      setSelectedIcon('menu_book');
      setSelectedDays([1, 2, 3, 4, 5]);

      await loadHabits();

      // Refrescar perfil para posibles logros desbloqueados ("Coleccionista")
      const meData = await api.getMe();
      if (meData) {
        onUpdateUser(meData);
      }

      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError(err.message || 'Error al guardar el hábito');
    } finally {
      setSubmitting(false);
    }
  };

  // Iniciar edición de un hábito
  const handleStartEdit = (habit) => {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setDifficulty(habit.difficulty);
    setSelectedIcon(habit.icon || 'water_drop');
    setSelectedDays(habit.days_of_week || [1, 2, 3, 4, 5]);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setHabitName('');
    setDifficulty('medium');
    setSelectedIcon('menu_book');
    setSelectedDays([1, 2, 3, 4, 5]);
    setError('');
  };

  // Eliminar hábito con doble clic / confirmación de 3 segundos
  const handleDeleteClick = async (habitId) => {
    if (armedDeleteId === habitId) {
      // Confirmado
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      setArmedDeleteId(null);
      try {
        await api.deleteHabit(habitId);
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
        setSuccessMsg('Misión eliminada correctamente');
        setTimeout(() => setSuccessMsg(''), 2500);
      } catch (err) {
        setError(err.message || 'Error al eliminar hábito');
      }
    } else {
      // Armar confirmación
      setArmedDeleteId(habitId);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => {
        setArmedDeleteId(null);
      }, 3000);
    }
  };

  // Guardar configuración de recompensas personalizadas
  const handleSaveRewards = async (e) => {
    e.preventDefault();
    setSavingRewards(true);
    setError('');

    try {
      const updatedUser = await api.updateRewards({
        reward_25: reward25.trim() || user?.reward_25,
        reward_50: reward50.trim() || user?.reward_50,
        reward_75: reward75.trim() || user?.reward_75,
        reward_100: reward100.trim() || user?.reward_100,
      });

      if (updatedUser) {
        onUpdateUser(updatedUser);
      }
      setRewardsSuccess(true);
      setTimeout(() => setRewardsSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error al actualizar recompensas');
    } finally {
      setSavingRewards(false);
    }
  };

  // Formato legible de días
  const formatDaysSummary = (days) => {
    if (!days || days.length === 0) return 'Sin días';
    if (days.length === 7) return 'DIARIO';
    const sorted = [...days].sort((a, b) => a - b);
    const joined = sorted.join(',');
    if (joined === '1,2,3,4,5') return 'LUN - VIE';
    if (joined === '6,7') return 'FIN DE SEMANA';
    return null;
  };

  // Calcular potencial de EXP de todos los hábitos activos
  const totalPotentialXp = habits.reduce(
    (acc, h) => acc + (DIFFICULTY_CONFIG[h.difficulty]?.xp || 10),
    0
  );

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Alertas */}
      {error && (
        <div className="p-3 rounded-xl bg-error-container/40 border border-error/50 text-error flex items-center justify-between text-body-sm shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-error hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-tertiary-container/40 border border-tertiary/50 text-tertiary flex items-center gap-2 text-body-sm shadow-lg">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header Stat Card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">
              terminal
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              MOTOR DE GESTIÓN DE MISIONES
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-wide text-white">
            REGISTRO DE MISIONES Y HÁBITOS
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Configura tus desafíos diarios para escalar
          </p>
        </div>

        <div className="mt-space-md grid grid-cols-3 gap-space-xs bg-surface-container-lowest p-space-xs rounded-lg text-center">
          <div className="flex flex-col py-1">
            <span className="font-label-sm text-label-sm text-outline">
              MISIONES ACTIVAS
            </span>
            <span className="font-headline-sm text-headline-sm text-primary">
              {String(habits.length).padStart(2, '0')} / 08
            </span>
          </div>
          <div className="flex flex-col py-1 bg-surface-container-high/40 rounded">
            <span className="font-label-sm text-label-sm text-outline">
              POTENCIAL DE ESCALÓN
            </span>
            <span className="font-headline-sm text-headline-sm text-tertiary">
              +{totalPotentialXp} EXP
            </span>
          </div>
          <div className="flex flex-col py-1">
            <span className="font-label-sm text-label-sm text-outline">
              CICLO DE RACHA
            </span>
            <span className="font-headline-sm text-headline-sm text-secondary-fixed">
              {user?.current_streak || 0} DÍAS
            </span>
          </div>
        </div>
      </div>

      {/* Formulario Crear / Editar Hábito */}
      <section
        ref={formRef}
        className="rounded-xl bg-surface-container p-space-md shadow-xl flex flex-col gap-space-md relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase shadow-sm text-white">
              {editingId ? '✎ EDITAR HÁBITO' : '+ CREAR NUEVO HÁBITO'}
            </span>
            <span className="font-label-sm text-label-sm text-tertiary uppercase">
              {editingId ? 'MODO: EDICIÓN' : 'MODO: ACTIVO'}
            </span>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-outline hover:text-white font-label-sm text-label-sm underline"
            >
              Cancelar
            </button>
          ) : (
            <span className="material-symbols-outlined text-primary text-[20px]">
              auto_fix_high
            </span>
          )}
        </div>

        {/* Input Nombre */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-sm text-label-sm uppercase text-white flex items-center justify-between">
            <span>OBJETIVO DEL HÁBITO</span>
            <span className="text-outline">Máx 80 caracteres</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={80}
              placeholder="ej. Correr 15 minutos al amanecer"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-body-md rounded-xl px-space-md py-3 focus:outline-none focus:bg-surface-container-low shadow-inner transition-colors"
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-secondary text-[20px] pointer-events-none">
              edit_note
            </span>
          </div>
        </div>

        {/* Dificultad y EXP */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-sm text-label-sm uppercase text-white">
            CLASE DE DIFICULTAD Y EXP
          </label>
          <div className="grid grid-cols-3 gap-space-xs">
            {Object.entries(DIFFICULTY_CONFIG).map(([diffKey, config]) => {
              const isSelected = difficulty === diffKey;
              return (
                <button
                  key={diffKey}
                  type="button"
                  onClick={() => setDifficulty(diffKey)}
                  className={`diff-btn flex flex-col items-center justify-center p-space-sm rounded-lg transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-high shadow-md ring-1 ring-secondary'
                      : 'bg-surface-container-low hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`font-label-sm text-label-sm uppercase ${config.colorClass}`}
                  >
                    {config.label}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-white">
                    +{config.xp} EXP
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-0.5">
                    {config.rank}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Icono */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-sm text-label-sm uppercase text-white">
            FIRMA DE RUNA / ÍCONO
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-surface-container-lowest p-space-xs rounded-xl">
            {ICONS_CATALOG.map((item) => {
              const isSelected = selectedIcon === item.icon;
              return (
                <button
                  key={item.icon}
                  type="button"
                  onClick={() => setSelectedIcon(item.icon)}
                  className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-secondary-container shadow-md text-white'
                      : 'bg-surface-container hover:bg-surface-container-high text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm mt-1 truncate ${
                      isSelected ? 'text-white font-bold' : 'text-outline'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frecuencia / Días de la semana ISO */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-sm text-label-sm uppercase text-white flex justify-between items-center">
            <span>FRECUENCIA ACTIVA</span>
            <span className="text-tertiary">
              {selectedDays.length} DÍAS PROGRAMADOS
            </span>
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.iso);
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => handleToggleDay(day.iso)}
                  className={`py-2 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-white shadow-sm font-bold'
                      : 'bg-surface-container-lowest text-outline hover:bg-surface-container-high'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón Guardar Hábito */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmitHabit}
          className="w-full mt-2 py-3.5 px-space-md rounded-xl bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-space-xs shadow-lg transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">bolt</span>
          <span>
            {submitting
              ? 'GUARDANDO...'
              : editingId
              ? 'ACTUALIZAR HÁBITO [GUARDAR]'
              : 'AÑADIR A ESCALONES DIARIOS [GUARDAR]'}
          </span>
        </button>
      </section>

      {/* Roster Activo de Hábitos */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm uppercase text-white">
              ROSTER ACTIVO
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-label-sm text-primary">
              {habits.length} CARGADOS
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            CONFIGURACIÓN
          </span>
        </div>

        <div className="flex flex-col gap-space-xs" id="habitList">
          {loading ? (
            <div className="p-8 text-center text-outline font-label-sm">
              Cargando hábitos...
            </div>
          ) : habits.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-container-low text-center text-on-surface-variant font-body-md">
              No tienes ningún hábito creado aún. ¡Usa el formulario de arriba para añadir tu primera misión!
            </div>
          ) : (
            habits.map((habit) => {
              const diffConfig =
                DIFFICULTY_CONFIG[habit.difficulty] || DIFFICULTY_CONFIG.easy;
              const summary = formatDaysSummary(habit.days_of_week);
              const isArmed = armedDeleteId === habit.id;

              return (
                <div
                  key={habit.id}
                  className="habit-item flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-all shadow-sm"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[20px] select-none">
                      drag_indicator
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                      {habit.icon?.length <= 2 ? (
                        <span className="text-[20px]">{habit.icon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[22px]">
                          {habit.icon || 'star'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-body-lg text-body-lg text-white truncate font-medium">
                          {habit.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-label-sm text-label-sm uppercase ${diffConfig.bgClass} ${diffConfig.colorClass}`}
                        >
                          {diffConfig.label} +{habit.xp_base} EXP
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {summary ? (
                          <span className="font-label-sm text-label-sm text-secondary-fixed font-bold">
                            {summary}
                          </span>
                        ) : (
                          <div className="flex gap-0.5">
                            {DAYS_OF_WEEK.filter((d) =>
                              habit.days_of_week?.includes(d.iso)
                            ).map((d) => (
                              <span
                                key={d.iso}
                                className="px-1 py-0.2 rounded bg-surface-container-highest font-label-sm text-label-sm text-primary"
                              >
                                {d.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(habit)}
                      className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors cursor-pointer"
                      title="Editar misión"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>

                    {/* Botón Eliminar con Confirmación */}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(habit.id)}
                      className={`delete-btn p-2 rounded-lg transition-colors cursor-pointer ${
                        isArmed
                          ? 'bg-error text-on-error animate-pulse'
                          : 'bg-surface-container hover:bg-error-container text-outline hover:text-error'
                      }`}
                      title={isArmed ? '¿Confirmar eliminación?' : 'Eliminar misión'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isArmed ? 'check' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Configuración de Recompensas (RF-13) */}
      <section className="rounded-xl bg-surface-container p-space-md shadow-xl flex flex-col gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm uppercase text-secondary flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                military_tech
              </span>
              <span>CONFIGURACIÓN DE RECOMPENSAS</span>
            </h2>
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-label-sm text-label-sm">
              DESBLOQUEO AUTOMÁTICO
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Date un premio al alcanzar los hitos de la escalera
          </p>
        </div>

        <form onSubmit={handleSaveRewards} className="flex flex-col gap-space-sm">
          {/* Recompensa 25% */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-tertiary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                Recompensa al 25%
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Desbloqueo Nivel 1
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={120}
                value={reward25}
                onChange={(e) => setReward25(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-xl px-space-md py-2.5 focus:outline-none focus:bg-surface-container-low shadow-inner transition-colors"
                placeholder="ej. Breve descanso de 5 min"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-tertiary text-[18px]">
                coffee
              </span>
            </div>
          </div>

          {/* Recompensa 50% */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Recompensa al 50%
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Hito de medio camino
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={120}
                value={reward50}
                onChange={(e) => setReward50(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-xl px-space-md py-2.5 focus:outline-none focus:bg-surface-container-low shadow-inner transition-colors"
                placeholder="ej. Café o merienda especial"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-primary text-[18px]">
                local_cafe
              </span>
            </div>
          </div>

          {/* Recompensa 75% */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-secondary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Recompensa al 75%
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Impulso de gran altura
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={120}
                value={reward75}
                onChange={(e) => setReward75(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-xl px-space-md py-2.5 focus:outline-none focus:bg-surface-container-low shadow-inner transition-colors"
                placeholder="ej. Postre de chocolate"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-secondary text-[18px]">
                bakery_dining
              </span>
            </div>
          </div>

          {/* Recompensa 100% */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-tertiary-fixed flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                Recompensa al 100%
              </span>
              <span className="font-label-sm text-label-sm text-tertiary font-bold">
                Corona de la Cima
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={120}
                value={reward100}
                onChange={(e) => setReward100(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-xl px-space-md py-2.5 focus:outline-none focus:bg-surface-container-low shadow-inner transition-colors"
                placeholder="ej. ¡2 horas de videojuegos sin culpa!"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-tertiary-fixed text-[18px]">
                sports_esports
              </span>
            </div>
          </div>

          {/* Botón Actualizar Recompensas */}
          <button
            type="submit"
            disabled={savingRewards}
            className={`w-full py-3 px-space-md rounded-xl font-headline-sm text-headline-sm uppercase tracking-wide flex items-center justify-center gap-space-xs transition-colors shadow-sm cursor-pointer text-white mt-1 ${
              rewardsSuccess
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container-high hover:bg-secondary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {rewardsSuccess ? 'verified' : 'award_star'}
            </span>
            <span>
              {savingRewards
                ? 'GUARDANDO...'
                : rewardsSuccess
                ? '¡RECOMPENSAS SINCRONIZADAS!'
                : 'ACTUALIZAR RECOMPENSAS'}
            </span>
          </button>
        </form>
      </section>
    </div>
  );
}

