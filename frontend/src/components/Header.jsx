import React from 'react';
import { LOGO_URL, PETS } from '../constants';

// Encabezado superior persistente con logo, nivel, racha y avatar de la mascota
export default function Header({ user, onNavigate }) {
  const level = user?.level || 1;
  const streak = user?.current_streak || 0;
  const pet = PETS[user?.pet] || PETS.cat;

  return (
    <header className="fixed top-0 w-full max-w-xl z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(1,15,31,0.8)]">
      <div className="h-20 px-space-md flex items-center justify-between">
        <div
          className="flex items-center gap-space-sm cursor-pointer select-none"
          onClick={() => onNavigate('home')}
        >
          <img
            alt="First Step Logo"
            className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(77,142,255,0.4)]"
            src={LOGO_URL}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm uppercase tracking-wide text-white">
                First Step
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary uppercase font-bold">
                NV. {String(level).padStart(2, '0')}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              Sube un escalón cada día
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container-low shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[16px] animate-pulse">
              local_fire_department
            </span>
            <span className="font-label-sm text-label-sm text-secondary-fixed font-bold">
              {streak} DÍAS
            </span>
          </div>
          <button
            type="button"
            className="p-0.5 rounded-full bg-secondary-container hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            onClick={() => onNavigate('profile')}
            title="Ver Perfil"
          >
            <img
              alt="Mascota"
              className="w-8 h-8 rounded-full object-cover"
              src={pet.avatar}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

