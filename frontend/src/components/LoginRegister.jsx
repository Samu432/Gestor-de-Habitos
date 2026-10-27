import React, { useState } from 'react';
import { api, setToken } from '../api';
import { LOGO_URL, PETS } from '../constants';

// Pantalla de Inicio de Sesión y Registro (RF-01, RF-02, RF-03)
export default function LoginRegister({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPet, setSelectedPet] = useState('cat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Por favor ingresa tu nombre de aventurero');
        }
        data = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          pet: selectedPet,
        });
      } else {
        data = await api.login({
          email: email.trim().toLowerCase(),
          password,
        });
      }

      if (data?.access_token) {
        setToken(data.access_token);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Error al autenticarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-space-md bg-background selection:bg-secondary selection:text-on-secondary">
      <main className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0_10px_30px_rgba(1,15,31,0.9)] p-space-lg">
        <div className="flex flex-col w-full relative">
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-space-md">
            <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              HÁBITOS ROGUE-LITE 16-BIT
            </div>
          </div>

          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center text-center mb-space-lg">
            <div className="relative w-20 h-20 mb-space-sm flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"></div>
              <img
                alt="First Step Logo"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_12px_rgba(77,142,255,0.7)]"
                src={LOGO_URL}
              />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-background tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(77,142,255,0.4)] text-white">
              FIRST STEP
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
              Sube un escalón cada día. Construye un hábito imparable.
            </p>
          </div>

          {/* Tarjeta del Formulario */}
          <div className="bg-surface-container rounded-xl p-space-md shadow-xl relative overflow-hidden">
            {/* Gradiente superior */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-container via-secondary to-tertiary opacity-80"></div>

            {/* Selector de Pestañas */}
            <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-lg mb-space-md" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`py-2 rounded-md font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
                  !isRegister
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-body-sm">login</span>
                INICIAR SESIÓN
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`py-2 rounded-md font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${
                  isRegister
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-body-sm">person_add</span>
                REGISTRARSE
              </button>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/40 text-error flex items-center gap-2 text-body-sm animate-shake">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form className="space-y-space-md" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="space-y-1.5">
                  <label
                    className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
                    htmlFor="adventurer-name"
                  >
                    Nombre de Aventurero
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-lg pointer-events-none">
                      badge
                    </span>
                    <input
                      id="adventurer-name"
                      type="text"
                      required
                      placeholder="ej. HeroePixel_99"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg pl-10 pr-3 py-2.5 placeholder-outline-variant focus:outline-none focus:bg-surface-container-high transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
                  htmlFor="adventurer-email"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    id="adventurer-email"
                    type="email"
                    required
                    placeholder="heroe@firststep.game"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg pl-10 pr-3 py-2.5 placeholder-outline-variant focus:outline-none focus:bg-surface-container-high transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
                    htmlFor="adventurer-password"
                  >
                    Clave de Acceso / Contraseña
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    id="adventurer-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Introduce contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg pl-10 pr-10 py-2.5 placeholder-outline-variant focus:outline-none focus:bg-surface-container-high transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar u ocultar contraseña"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-body-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Selector de Mascota en Registro (RF-03) */}
              {isRegister && (
                <div className="space-y-2 pt-space-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Elige Tu Compañero
                    </label>
                    <span className="font-label-sm text-label-sm text-secondary bg-surface-container-lowest px-2 py-0.5 rounded">
                      CLASE: EXPLORADOR
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm">
                    {/* Luna (Gato) */}
                    <div
                      onClick={() => setSelectedPet('cat')}
                      className={`relative group cursor-pointer rounded-xl p-2.5 transition-all ${
                        selectedPet === 'cat'
                          ? 'bg-surface-container-high shadow-md'
                          : 'bg-surface-container-lowest hover:bg-surface-container-high'
                      }`}
                    >
                      {selectedPet === 'cat' && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-body-sm font-bold">check</span>
                        </div>
                      )}
                      <div className="w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-2 relative">
                        <img
                          alt="Gato Pixel Mascota Luna"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform"
                          src={PETS.cat.avatar}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
                        <span className="absolute bottom-1 left-1.5 font-label-sm text-label-sm text-secondary">
                          NIVEL 01
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h2 className="font-headline-sm text-headline-sm text-on-background">Luna (Gato)</h2>
                      </div>
                    </div>

                    {/* Buster (Perro) */}
                    <div
                      onClick={() => setSelectedPet('dog')}
                      className={`relative group cursor-pointer rounded-xl p-2.5 transition-all ${
                        selectedPet === 'dog'
                          ? 'bg-surface-container-high shadow-md'
                          : 'bg-surface-container-lowest hover:bg-surface-container-high'
                      }`}
                    >
                      {selectedPet === 'dog' && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-body-sm font-bold">check</span>
                        </div>
                      )}
                      <div className="w-full aspect-square rounded-lg bg-surface-container-lowest overflow-hidden mb-2 relative">
                        <img
                          alt="Perro Pixel Mascota Buster"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform"
                          src={PETS.dog.avatar}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
                        <span className="absolute bottom-1 left-1.5 font-label-sm text-label-sm text-secondary">
                          NIVEL 01
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h2 className="font-headline-sm text-headline-sm text-on-background">Buster (Perro)</h2>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-surface font-headline-sm text-headline-sm tracking-wide uppercase shadow-[0_0_24px_rgba(77,142,255,0.45)] hover:shadow-[0_0_32px_rgba(77,142,255,0.6)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-space-md disabled:opacity-50 cursor-pointer text-white"
              >
                <span className="material-symbols-outlined text-headline-sm">sports_esports</span>
                <span>
                  {loading
                    ? 'CARGANDO...'
                    : isRegister
                    ? 'INICIAR AVENTURA'
                    : 'CONTINUAR EXPEDICIÓN'}
                </span>
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center gap-3 my-space-md">
              <div className="h-px bg-surface-variant flex-1"></div>
              <span className="font-label-sm text-label-sm text-outline tracking-wider">O</span>
              <div className="h-px bg-surface-variant flex-1"></div>
            </div>

            {/* Alternar modo */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                {isRegister ? (
                  <>
                    ¿Ya tienes una partida guardada?{' '}
                    <span className="font-label-sm text-label-sm text-primary underline hover:text-primary-fixed">
                      Cargar Partida
                    </span>
                  </>
                ) : (
                  <>
                    ¿Nuevo en la torre?{' '}
                    <span className="font-label-sm text-label-sm text-primary underline hover:text-primary-fixed">
                      Crear Partida
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer de Estado del Servidor */}
          <div className="flex items-center justify-center gap-space-lg text-outline font-label-sm text-label-sm mt-space-md uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> ESTADO DEL SERVIDOR EN LÍNEA
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

