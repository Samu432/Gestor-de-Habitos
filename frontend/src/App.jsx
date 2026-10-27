import React, { useState, useEffect } from 'react';
import { api, getToken, clearToken } from './api';
import Header from './components/Header';
import Navbar from './components/Navbar';
import LoginRegister from './components/LoginRegister';
import Today from './components/Today';
import Habits from './components/Habits';
import Profile from './components/Profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'habits' | 'profile'
  const [initializing, setInitializing] = useState(true);

  // Comprobar sesión al inicio
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Error al restaurar sesión:', err);
        clearToken();
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    initAuth();

    // Listener para expiración de sesión (401)
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setActiveTab('home');
  };

  const handleUpdateUser = (partialOrFullUser) => {
    setUser((prev) => (prev ? { ...prev, ...partialOrFullUser } : partialOrFullUser));
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setActiveTab('home');
  };

  if (initializing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="font-headline-sm text-headline-sm text-white tracking-wider uppercase">
            Iniciando First Step...
          </span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, muestra la pantalla de inicio de sesión / registro
  if (!user) {
    return <LoginRegister onAuthSuccess={handleAuthSuccess} />;
  }

  // Si está autenticado, muestra el contenedor principal con la cabecera y barra de navegación
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-background text-on-surface selection:bg-secondary selection:text-on-secondary">
      <div className="w-full max-w-xl flex flex-col min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Cabecera persistente */}
        <Header user={user} onNavigate={setActiveTab} />

        {/* Contenido principal según la pestaña activa */}
        <main className="w-full pt-24 pb-28 px-space-md flex-1">
          {activeTab === 'home' && (
            <Today
              user={user}
              onUpdateUser={handleUpdateUser}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'habits' && (
            <Habits
              user={user}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'profile' && (
            <Profile
              user={user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Barra de navegación inferior */}
        <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      </div>
    </div>
  );
}

