import React from 'react';

// Barra de navegación inferior flotante con los 3 accesos principales
export default function Navbar({ activeTab, onNavigate }) {
  const tabs = [
    { id: 'home', label: 'Hoy', icon: 'sports_esports' },
    { id: 'habits', label: 'Hábitos', icon: 'format_list_bulleted' },
    { id: 'profile', label: 'Perfil', icon: 'shield_person' },
  ];

  return (
    <footer className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-space-md pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-md bg-surface-container/95 backdrop-blur-xl rounded-xl p-space-xs flex items-center justify-around shadow-[0_12px_32px_rgba(1,15,31,0.9)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-space-sm rounded-lg transition-all gap-1 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-headline-sm shadow-[0_0_16px_rgba(87,27,193,0.5)] text-white'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
}

