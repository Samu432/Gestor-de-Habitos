import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DIFFICULTY_CONFIG, PETS } from '../constants';

// Pantalla "Hoy": Escalera diaria, misiones del día, recompensa y montaña semanal (RF-05, RF-06, RF-07, RF-08, RF-11, RF-12, RF-14)
export default function Today({ user, onUpdateUser, onNavigate }) {
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');

  const pet = PETS[user?.pet] || PETS.cat;

  const loadData = async () => {
    try {
      setError('');
      const [todayRes, weekRes] = await Promise.all([
        api.getToday(),
        api.getWeek(),
      ]);
      setTodayData(todayRes);
      setWeekData(weekRes);

      if (todayRes) {
        onUpdateUser({
          xp_total: todayRes.xp_total,
          level: todayRes.level,
          current_streak: todayRes.current_streak,
        });
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos de hoy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleHabit = async (habit) => {
    if (actionLoading[habit.id]) return;
    setActionLoading((prev) => ({ ...prev, [habit.id]: true }));
    setError('');

    try {
      let res;
      if (habit.completed) {
        res = await api.uncompleteHabit(habit.id);
      } else {
        res = await api.completeHabit(habit.id);
      }

      // Actualizar datos locales y usuario
      if (res) {
        onUpdateUser({
          xp_total: res.xp_total,
          level: res.level,
          current_streak: res.current_streak,
        });
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Error al actualizar el hábito');
    } finally {
      setActionLoading((prev) => ({ ...prev, [habit.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 text-on-surface-variant gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="font-label-md text-label-md uppercase tracking-wider">
          Cargando escalera de hoy...
        </span>
      </div>
    );
  }

  const totalHabits = todayData?.total || 0;
  const completedHabits = todayData?.completed || 0;
  const percent = todayData?.percent || 0;
  const currentLevel = todayData?.level || user?.level || 1;
  const streak = todayData?.current_streak ?? user?.current_streak ?? 0;
  const xpTotal = todayData?.xp_total ?? user?.xp_total ?? 0;
  const xpInLevel = xpTotal % 100;

  // Color de los pilares semanales según el porcentaje (RF-12, AGENTS.md)
  const getPillarColor = (pct) => {
    if (pct >= 100) return 'bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.7)]';
    if (pct >= 75) return 'bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)]';
    if (pct >= 50) return 'bg-[#3B82F6] shadow-[0_0_6px_rgba(59,130,246,0.5)]';
    if (pct >= 25) return 'bg-[#1E3A8A]';
    return 'bg-[#2A2A40]';
  };

  // Recompensa actual desbloqueada (RF-14)
  const getUnlockedRewardText = () => {
    if (percent >= 100) return user?.reward_100 || '¡Recompensa de Cima!';
    if (percent >= 75) return user?.reward_75 || 'Recompensa 75%';
    if (percent >= 50) return user?.reward_50 || 'Recompensa 50%';
    if (percent >= 25) return user?.reward_25 || 'Recompensa 25%';
    return 'Completa escalones para desbloquear recompensas';
  };

  // Escalera SVG dinámica
  const stairCount = Math.max(totalHabits, 1);
  const stepWidth = Math.min(54, Math.floor(320 / stairCount));
  const stepHeight = Math.min(32, Math.floor(130 / stairCount));
  const startX = 35;
  const groundY = 210;

  // Posición del gato/perro en el escalón
  const mascotStepIndex = completedHabits > 0 ? completedHabits - 1 : 0;
  const mascotX = completedHabits > 0 ? startX + mascotStepIndex * stepWidth + 6 : 8;
  const mascotY = completedHabits > 0 ? groundY - (mascotStepIndex + 1) * stepHeight - 34 : groundY - 42;

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Alerta de Error */}
      {error && (
        <div className="p-3 rounded-xl bg-error-container/40 border border-error/50 text-error flex items-center justify-between text-body-sm animate-shake shadow-lg">
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

      {/* Player HUD Card */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-tertiary-container/15 rounded-full blur-xl pointer-events-none"></div>

        {/* User Info & Streak Row */}
        <div className="flex items-center justify-between gap-space-sm relative z-10 mb-3">
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shadow-[0_0_12px_rgba(87,27,193,0.35)] overflow-hidden">
                <img
                  alt="Avatar Mascota"
                  src={pet.avatar}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-tertiary text-on-tertiary font-label-sm text-label-sm uppercase font-bold">
                NV.{currentLevel}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-white tracking-tight">
                {user?.name || 'Aventurero'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-label-sm text-label-sm uppercase text-secondary tracking-widest">
                  NV. {currentLevel} EXPLORADOR
                </span>
                <span className="w-1 h-1 rounded-full bg-outline"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {pet.label}
                </span>
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="px-2.5 py-1.5 rounded-lg bg-surface-container-high flex items-center gap-1.5 shadow-[0_0_14px_rgba(233,221,255,0.12)]">
            <span
              className="material-symbols-outlined text-error text-[18px] animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="font-label-md text-label-md text-on-background font-bold tracking-tight">
                {streak} DÍAS
              </span>
              <span className="font-label-sm text-label-sm text-error uppercase">
                Racha Activa
              </span>
            </div>
          </div>
        </div>

        {/* XP Gauge Segmented Meter */}
        <div className="space-y-1.5 relative z-10 pt-1">
          <div className="flex justify-between items-center text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary text-[14px]">
                bolt
              </span>
              <span className="font-label-sm text-label-sm uppercase text-tertiary font-bold tracking-wider">
                Progreso de EXP
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-on-background">
              <span className="text-tertiary">{xpInLevel}</span> / 100 EXP{' '}
              <span className="text-outline font-normal">({xpTotal} total)</span>
            </span>
          </div>

          {/* Retro 10-Segment Bar */}
          <div className="grid grid-cols-10 gap-1 p-1 rounded-lg bg-surface-container-lowest">
            {Array.from({ length: 10 }).map((_, i) => {
              const isFilled = xpInLevel >= (i + 1) * 10;
              let segmentClass = 'bg-surface-container-high/60';
              if (isFilled) {
                if (i < 4) {
                  segmentClass =
                    'bg-gradient-to-r from-tertiary-container to-tertiary shadow-[0_0_6px_rgba(78,222,163,0.6)]';
                } else if (i < 6) {
                  segmentClass =
                    'bg-gradient-to-r from-primary-container to-primary shadow-[0_0_6px_rgba(77,142,255,0.6)]';
                } else {
                  segmentClass =
                    'bg-gradient-to-r from-secondary-container to-secondary shadow-[0_0_6px_rgba(208,188,255,0.6)]';
                }
              }
              return (
                <div
                  key={i}
                  className={`h-2 rounded-[2px] transition-all duration-300 ${segmentClass}`}
                ></div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HERO: The Daily Neon Pixel Staircase Canvas (RF-11) */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-xl relative overflow-hidden">
        {/* Top Trophy Milestone Header */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-secondary-container/60 text-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-bold">
              TORRE DE ASCENSO
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Etapa {String(currentLevel).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm shadow-[0_0_8px_rgba(173,198,255,0.2)]">
            <span className="material-symbols-outlined text-[14px]">stairs</span>
            <span>
              ESCALÓN {completedHabits} DE {totalHabits}
            </span>
          </div>
        </div>

        {/* Staircase SVG Canvas */}
        <div className="relative w-full py-2 flex flex-col items-center">
          <svg
            className="w-full h-56 select-none overflow-visible"
            viewBox="0 0 420 240"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter height="140%" id="neon-glow" width="140%" x="-20%" y="-20%">
                <feGaussianBlur result="blur" stdDeviation="3.5"></feGaussianBlur>
                <feMerge>
                  <feMergeNode in="blur"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
              </filter>
              <linearGradient id="step-tread-done" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#C4B5FD"></stop>
                <stop offset="100%" stopColor="#8B5CF6"></stop>
              </linearGradient>
              <linearGradient id="step-locked" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B"></stop>
                <stop offset="100%" stopColor="#0F172A"></stop>
              </linearGradient>
              <linearGradient id="trophy-gold" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE047"></stop>
                <stop offset="100%" stopColor="#EAB308"></stop>
              </linearGradient>
            </defs>

            {/* Ambient Starry Grid Particles */}
            <circle cx="45" cy="40" fill="#ADC6FF" opacity="0.4" r="1.5"></circle>
            <circle cx="95" cy="20" fill="#D0BCFF" opacity="0.6" r="2"></circle>
            <circle cx="360" cy="50" fill="#4EDEA3" opacity="0.4" r="1.5"></circle>
            <circle cx="380" cy="140" fill="#ADC6FF" opacity="0.3" r="1.5"></circle>

            {/* Suelo Base */}
            <rect x="0" y={groundY} width="420" height="30" fill="#071524" opacity="0.8" />
            <line x1="0" y1={groundY} x2="420" y2={groundY} stroke="#1C2B3C" strokeWidth="2" />

            {/* Escalones dinámicos */}
            {totalHabits === 0 ? (
              <g transform="translate(140, 150)">
                <text
                  x="70"
                  y="20"
                  fill="#8C909F"
                  textAnchor="middle"
                  fontFamily="'Space Grotesk'"
                  fontSize="13"
                >
                  No hay hábitos para hoy
                </text>
              </g>
            ) : (
              Array.from({ length: totalHabits }).map((_, idx) => {
                const stepNum = idx + 1;
                const isDone = idx < completedHabits;
                const isSummit = stepNum === totalHabits;
                const x = startX + idx * stepWidth;
                const y = groundY - stepNum * stepHeight;
                const height = stepNum * stepHeight;
                const width = isSummit ? stepWidth + 16 : stepWidth;

                return (
                  <g key={idx} transform={`translate(${x}, ${y})`}>
                    {/* Cuerpo del escalón */}
                    <path
                      d={`M 0 20 L ${width} 20 L ${width} ${height} L 0 ${height} Z`}
                      fill={isDone ? '#3B1779' : '#0D1C2D'}
                    />
                    {/* Huella del escalón con luz de neón */}
                    <path
                      d={`M 0 0 L ${width} 0 L ${width} 20 L 0 20 Z`}
                      fill={isDone ? 'url(#step-tread-done)' : 'url(#step-locked)'}
                      filter={isDone ? 'url(#neon-glow)' : undefined}
                    />
                    <rect
                      fill={isDone ? '#E9DDFF' : '#424754'}
                      height="3"
                      width={width}
                      x="0"
                      y="0"
                    />

                    {/* Número del escalón */}
                    <text
                      fill={isDone ? '#051424' : '#8C909F'}
                      fontFamily="'Space Grotesk'"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      x={width / 2}
                      y="14"
                    >
                      {String(stepNum).padStart(2, '0')}
                    </text>

                    {/* Trofeo de la Cima en el último escalón */}
                    {isSummit && (
                      <g filter="url(#neon-glow)" transform={`translate(${width / 2 - 18}, -38)`}>
                        <rect fill="#CA8A04" height="4" rx="1" width="20" x="8" y="32"></rect>
                        <rect fill="#EAB308" height="5" width="10" x="13" y="27"></rect>
                        <path
                          d="M 10 9 L 26 9 L 24 23 Q 18 28 18 28 Q 18 28 12 23 Z"
                          fill="url(#trophy-gold)"
                        ></path>
                        <path
                          d="M 10 12 C 4 12 4 20 10 20"
                          fill="none"
                          stroke="#FDE047"
                          strokeWidth="2"
                        ></path>
                        <path
                          d="M 26 12 C 32 12 32 20 26 20"
                          fill="none"
                          stroke="#FDE047"
                          strokeWidth="2"
                        ></path>
                        <polygon
                          fill="#FEF08A"
                          points="18,0 20,5 25,6 21,9 22,14 18,11 14,14 15,9 11,6 16,5"
                        ></polygon>
                      </g>
                    )}
                  </g>
                );
              })
            )}

            {/* MASCOTA EN EL ESCALÓN (Luna o Buster en Pixel Art) */}
            {totalHabits > 0 && (
              <g
                transform={`translate(${mascotX}, ${mascotY})`}
                className="transition-all duration-500 ease-out"
              >
                {/* Sombra */}
                <ellipse cx="20" cy="50" fill="#000000" opacity="0.45" rx="16" ry="4"></ellipse>

                {pet.id === 'cat' ? (
                  /* Gato Pixel Luna */
                  <g>
                    {/* Cuerpo */}
                    <rect fill="#D0BCFF" height="22" rx="4" width="20" x="10" y="18"></rect>
                    {/* Cabeza */}
                    <rect fill="#D0BCFF" height="18" rx="3" width="26" x="7" y="6"></rect>
                    {/* Orejas */}
                    <polygon fill="#A855F7" points="8,6 13,0 16,6"></polygon>
                    <polygon fill="#A855F7" points="24,6 27,0 32,6"></polygon>
                    {/* Ojos */}
                    <rect fill="#051424" height="3" width="3" x="12" y="12"></rect>
                    <rect fill="#051424" height="3" width="3" x="25" y="12"></rect>
                    <polygon fill="#F472B6" points="19,16 21,16 20,18"></polygon>
                    {/* Capa / Bufanda */}
                    <rect fill="#4EDEA3" height="5" rx="1" width="26" x="7" y="22"></rect>
                    {/* Cola */}
                    <path
                      d="M 28 34 Q 38 30 36 20"
                      fill="none"
                      stroke="#D0BCFF"
                      strokeLinecap="round"
                      strokeWidth="4"
                    ></path>
                    {/* Destello */}
                    <text fill="#FDE047" fontSize="10" opacity="0.9" x="35" y="6">
                      ✦
                    </text>
                  </g>
                ) : (
                  /* Perro Pixel Buster */
                  <g>
                    {/* Cuerpo */}
                    <rect fill="#ADC6FF" height="22" rx="4" width="22" x="9" y="18"></rect>
                    {/* Cabeza */}
                    <rect fill="#ADC6FF" height="18" rx="3" width="26" x="7" y="6"></rect>
                    {/* Orejas caídas */}
                    <polygon fill="#4D8EFF" points="7,8 3,18 10,16"></polygon>
                    <polygon fill="#4D8EFF" points="33,8 37,18 30,16"></polygon>
                    {/* Ojos y hocico */}
                    <rect fill="#051424" height="3" width="3" x="13" y="12"></rect>
                    <rect fill="#051424" height="3" width="3" x="24" y="12"></rect>
                    <rect fill="#001A42" height="3" width="4" rx="1" x="18" y="16"></rect>
                    {/* Pañuelo rojo explorador */}
                    <rect fill="#FFB4AB" height="5" rx="1" width="26" x="7" y="22"></rect>
                    {/* Cola alegre */}
                    <path
                      d="M 29 32 Q 38 24 35 16"
                      fill="none"
                      stroke="#ADC6FF"
                      strokeLinecap="round"
                      strokeWidth="4"
                    ></path>
                    <text fill="#FDE047" fontSize="10" opacity="0.9" x="35" y="6">
                      ✦
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Globo de Pensamiento de la Mascota */}
            {totalHabits > 0 && (
              <g
                transform={`translate(${Math.max(10, Math.min(mascotX - 40, 260))}, ${Math.max(
                  8,
                  mascotY - 32
                )})`}
              >
                <rect
                  fill="#1C2B3C"
                  height="26"
                  rx="6"
                  stroke="#ADC6FF"
                  strokeWidth="1"
                  width="145"
                  x="0"
                  y="0"
                ></rect>
                <polygon fill="#1C2B3C" points="60,26 66,32 72,26"></polygon>
                <text
                  fill="#D4E4FA"
                  fontFamily="'Plus Jakarta Sans'"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  x="72"
                  y="17"
                >
                  {completedHabits === totalHabits && totalHabits > 0
                    ? '¡Cima conquistada! 🎉'
                    : `¡A ${totalHabits - completedHabits} escalones de la cima! 🐾`}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Summit Badge Banner */}
        <div className="mt-1 flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">
              Ascenso de {pet.name}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm uppercase font-bold tracking-wider text-white">
            BONUS DÍA PERFECTO: +20 EXP
          </div>
        </div>
      </div>

      {/* Habit List / Quests for Today (RF-05, RF-06) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">
              checklist
            </span>
            <span className="font-headline-sm text-headline-sm uppercase tracking-wide text-white">
              Misiones de hoy
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm font-bold uppercase tracking-wider">
            {completedHabits} / {totalHabits} Completadas
          </span>
        </div>

        {/* Habit Cards Container */}
        <div className="space-y-2" id="quest-list">
          {(!todayData?.habits || todayData.habits.length === 0) ? (
            <div className="p-6 rounded-xl bg-surface-container-low text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-outline">
                assignment_late
              </span>
              <p className="text-on-surface-variant font-body-md">
                No tienes hábitos programados para hoy.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('habits')}
                className="px-4 py-2 rounded-xl bg-primary-container text-white font-label-sm text-label-sm uppercase tracking-wider hover:bg-primary transition-all cursor-pointer shadow-md"
              >
                Configurar Hábitos
              </button>
            </div>
          ) : (
            todayData.habits.map((habit, index) => {
              const diffConfig =
                DIFFICULTY_CONFIG[habit.difficulty] || DIFFICULTY_CONFIG.easy;
              const isChecked = habit.completed;
              const isProcessing = actionLoading[habit.id];

              return (
                <div
                  key={habit.id}
                  className={`quest-card group flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                    isChecked
                      ? 'bg-surface-container-low hover:bg-surface-container opacity-85'
                      : 'bg-surface-container-high hover:bg-surface-variant shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-[18px] select-none shrink-0">
                      {habit.icon?.length <= 2 ? (
                        <span>{habit.icon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-primary">
                          {habit.icon}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-body-lg text-body-lg font-semibold truncate ${
                          isChecked
                            ? 'text-on-surface-variant line-through text-slate-300'
                            : 'text-white'
                        }`}
                      >
                        {habit.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold ${diffConfig.bgClass} ${diffConfig.colorClass}`}
                        >
                          {diffConfig.label} +{habit.xp_base} EXP
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          {isChecked
                            ? 'Hecho hoy'
                            : `Objetivo Escalón ${index + 1}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de Marcar / Desmarcar */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleToggleHabit(habit)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2 ${
                      isChecked
                        ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_10px_rgba(78,222,163,0.4)]'
                        : 'bg-surface-container-lowest text-outline hover:bg-secondary-container hover:text-white'
                    }`}
                    title={isChecked ? 'Desmarcar hábito' : 'Cumplir hábito'}
                  >
                    {isProcessing ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        sync
                      </span>
                    ) : (
                      <span
                        className={`material-symbols-outlined text-[18px] font-bold ${
                          isChecked ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'
                        }`}
                      >
                        check
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reward Card: Today's Progression Reward (RF-13, RF-14) */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <span className="font-headline-sm text-headline-sm uppercase text-white">
              Recompensa de hoy
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-secondary-container text-white font-label-sm text-label-sm uppercase font-bold">
            {percent}% Desbloqueado
          </span>
        </div>

        <p className="font-body-md text-body-md text-secondary-fixed mb-4 font-medium">
          Recompensa actual:{' '}
          <span className="text-white font-bold">{getUnlockedRewardText()}</span>
        </p>

        {/* Multi-Tier Checkpoint Progress Bar */}
        <div className="space-y-2">
          <div className="relative w-full h-3 rounded-full bg-surface-container-lowest overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tertiary via-primary to-secondary transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          {/* 4 Tiers Matrix */}
          <div className="grid grid-cols-4 gap-1 text-center pt-1">
            {/* 25% */}
            <div
              className={`flex flex-col items-center ${
                percent >= 25 ? 'text-tertiary' : 'opacity-60 text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {percent >= 25 ? 'check_circle' : 'lock'}
              </span>
              <span className="font-label-sm text-label-sm font-bold">25%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full">
                {user?.reward_25 || 'Premio 25%'}
              </span>
            </div>

            {/* 50% */}
            <div
              className={`flex flex-col items-center ${
                percent >= 50 ? 'text-primary' : 'opacity-60 text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {percent >= 50 ? 'check_circle' : 'lock'}
              </span>
              <span className="font-label-sm text-label-sm font-bold">50%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full">
                {user?.reward_50 || 'Premio 50%'}
              </span>
            </div>

            {/* 75% */}
            <div
              className={`flex flex-col items-center ${
                percent >= 75 ? 'text-secondary-fixed' : 'opacity-60 text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {percent >= 75 ? 'check_circle' : 'lock'}
              </span>
              <span className="font-label-sm text-label-sm font-bold">75%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full">
                {user?.reward_75 || 'Premio 75%'}
              </span>
            </div>

            {/* 100% */}
            <div
              className={`flex flex-col items-center ${
                percent >= 100 ? 'text-tertiary' : 'opacity-60 text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {percent >= 100 ? 'stars' : 'lock'}
              </span>
              <span className="font-label-sm text-label-sm font-bold">100%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full">
                {user?.reward_100 || '¡Premio Cima!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Staircase Visualization: Montaña semanal (RF-12) */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              bar_chart
            </span>
            <span className="font-headline-sm text-headline-sm uppercase text-white">
              Montaña semanal
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Semana en Curso
          </span>
        </div>

        {/* 7 Ascending Stepped Pillars */}
        <div className="grid grid-cols-7 gap-2 items-end h-32 pt-2 pb-1">
          {weekData?.days?.map((day) => {
            const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const name = dayNames[day.weekday - 1] || 'Día';
            const colorClass = getPillarColor(day.percent);
            const heightPercent = Math.max(day.percent, 12);

            return (
              <div
                key={day.weekday}
                className="flex flex-col items-center h-full justify-end group relative"
              >
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${colorClass} ${
                    day.is_today ? 'animate-pulse' : ''
                  }`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.completed}/${day.total} (${day.percent}%)`}
                ></div>
                <span
                  className={`font-label-sm text-label-sm font-bold mt-1.5 uppercase ${
                    day.is_today ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {name}
                  {day.is_today ? '*' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Color Calibration Legend (AGENTS.md) */}
        <div className="mt-4 pt-3 flex items-center justify-between bg-surface-container-lowest/60 p-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2A2A40]"></span>
            <span className="font-label-sm text-label-sm text-outline">0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1E3A8A]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">25%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B82F6]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#7C3AED]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">75%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#A855F7] shadow-[0_0_4px_rgba(168,85,247,0.8)]"></span>
            <span className="font-label-sm text-label-sm text-secondary-fixed-dim font-bold">
              100% Cima
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

