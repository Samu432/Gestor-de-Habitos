import React, { useState, useEffect } from 'react';
import { api, clearToken } from '../api';
import { PETS } from '../constants';

// Pantalla "Perfil": Nivel, XP, Racha, Compañero y Logros desbloqueados/bloqueados (RF-02, RF-15, RF-16)
export default function Profile({ user, onUpdateUser, onLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [switchingPet, setSwitchingPet] = useState(false);

  const loadProfile = async () => {
    try {
      setError('');
      const data = await api.getMe();
      setProfileData(data);
      if (data) {
        onUpdateUser(data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSwitchPet = async (petKey) => {
    if (switchingPet || profileData?.pet === petKey) return;
    setSwitchingPet(true);
    setError('');

    try {
      const updated = await api.updateRewards({ pet: petKey });
      if (updated) {
        onUpdateUser(updated);
        await loadProfile();
      }
    } catch (err) {
      setError(err.message || 'Error al cambiar de mascota');
    } finally {
      setSwitchingPet(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 text-on-surface-variant gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="font-label-md text-label-md uppercase tracking-wider">
          Cargando expediente de aventurero...
        </span>
      </div>
    );
  }

  const currentUser = profileData || user;
  const currentPet = PETS[currentUser?.pet] || PETS.cat;
  const achievements = profileData?.achievements || [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Alerta de Error */}
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

      {/* Hero Card del Aventurero */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-primary-container/15 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
          {/* Avatar de Mascota */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-high p-1 shadow-[0_0_20px_rgba(87,27,193,0.4)] overflow-hidden">
              <img
                alt={currentPet.name}
                className="w-full h-full object-cover rounded-xl"
                src={currentPet.avatar}
              />
            </div>
            <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-sm text-label-sm uppercase font-bold shadow-md">
              NV.{currentUser?.level || 1}
            </span>
          </div>

          {/* Información */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-white uppercase tracking-wide truncate">
                {currentUser?.name || 'Aventurero'}
              </h1>
            </div>
            <span className="font-body-sm text-body-sm text-outline truncate mb-1">
              {currentUser?.email}
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              EXPLORADOR DE TORRE ROGUE-LITE
            </div>
          </div>
        </div>

        {/* Estadísticas Cuadrícula */}
        <div className="mt-space-md grid grid-cols-3 gap-space-xs bg-surface-container-lowest p-space-xs rounded-xl text-center">
          <div className="flex flex-col py-1.5">
            <span className="font-label-sm text-label-sm text-outline uppercase">
              EXPERIENCIA
            </span>
            <span className="font-headline-sm text-headline-sm text-primary">
              {currentUser?.xp_total || 0} EXP
            </span>
          </div>
          <div className="flex flex-col py-1.5 bg-surface-container-high/40 rounded-lg">
            <span className="font-label-sm text-label-sm text-outline uppercase">
              RACHA MÁXIMA
            </span>
            <span className="font-headline-sm text-headline-sm text-secondary-fixed">
              {currentUser?.current_streak || 0} DÍAS
            </span>
          </div>
          <div className="flex flex-col py-1.5">
            <span className="font-label-sm text-label-sm text-outline uppercase">
              LOGROS
            </span>
            <span className="font-headline-sm text-headline-sm text-tertiary">
              {unlockedCount} / {achievements.length || 6}
            </span>
          </div>
        </div>
      </div>

      {/* Compañero de Aventura (Cambio de Mascota) */}
      <section className="rounded-xl bg-surface-container p-space-md shadow-xl flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              pets
            </span>
            <h2 className="font-headline-sm text-headline-sm uppercase text-white">
              Compañero de Expedición
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-outline uppercase">
            SELECCIONA TU MASCOTA
          </span>
        </div>

        <div className="grid grid-cols-2 gap-space-sm pt-1">
          {/* Gato Luna */}
          <button
            type="button"
            disabled={switchingPet}
            onClick={() => handleSwitchPet('cat')}
            className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left ${
              currentUser?.pet === 'cat'
                ? 'bg-surface-container-high shadow-md ring-2 ring-secondary'
                : 'bg-surface-container-lowest hover:bg-surface-container-low opacity-70'
            }`}
          >
            <img
              alt="Gata Luna"
              src={PETS.cat.avatar}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-white truncate">
                Luna
              </span>
              <span className="font-label-sm text-label-sm text-secondary truncate">
                Gata Exploradora
              </span>
              {currentUser?.pet === 'cat' && (
                <span className="font-label-sm text-[10px] text-tertiary uppercase font-bold mt-0.5">
                  ✓ ACTIVA
                </span>
              )}
            </div>
          </button>

          {/* Perro Buster */}
          <button
            type="button"
            disabled={switchingPet}
            onClick={() => handleSwitchPet('dog')}
            className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left ${
              currentUser?.pet === 'dog'
                ? 'bg-surface-container-high shadow-md ring-2 ring-secondary'
                : 'bg-surface-container-lowest hover:bg-surface-container-low opacity-70'
            }`}
          >
            <img
              alt="Perro Buster"
              src={PETS.dog.avatar}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-white truncate">
                Buster
              </span>
              <span className="font-label-sm text-label-sm text-secondary truncate">
                Perro Guardián
              </span>
              {currentUser?.pet === 'dog' && (
                <span className="font-label-sm text-[10px] text-tertiary uppercase font-bold mt-0.5">
                  ✓ ACTIVO
                </span>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Salón de Logros (RF-15, RF-16) */}
      <section className="rounded-xl bg-surface-container p-space-md shadow-xl flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              emoji_events
            </span>
            <h2 className="font-headline-sm text-headline-sm uppercase text-white">
              Salón de Logros
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-label-sm text-label-sm font-bold uppercase">
            {unlockedCount} / {achievements.length} Desbloqueados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            return (
              <div
                key={ach.code}
                className={`p-3.5 rounded-xl transition-all flex items-start gap-3 border ${
                  isUnlocked
                    ? 'bg-surface-container-low border-secondary/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                    : 'bg-surface-container-lowest border-surface-container-high opacity-50'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center text-[22px] shrink-0 select-none ${
                    isUnlocked
                      ? 'bg-secondary-container/40 text-secondary-fixed shadow-inner'
                      : 'bg-surface-container-high text-outline'
                  }`}
                >
                  {ach.icon?.length <= 2 ? (
                    <span>{ach.icon}</span>
                  ) : (
                    <span className="material-symbols-outlined text-[24px]">
                      {ach.icon || 'military_tech'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-headline-sm text-[15px] font-bold truncate ${
                        isUnlocked ? 'text-white' : 'text-outline'
                      }`}
                    >
                      {ach.name}
                    </span>
                    <span
                      className={`font-label-sm text-[10px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        isUnlocked
                          ? 'bg-tertiary-container/30 text-tertiary'
                          : 'bg-surface-container-high text-outline'
                      }`}
                    >
                      {isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                    </span>
                  </div>

                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botón de Cerrar Sesión (RF-02) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            clearToken();
            onLogout();
          }}
          className="w-full py-3.5 px-4 rounded-xl border border-error/40 hover:bg-error-container/30 text-error font-headline-sm text-headline-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

