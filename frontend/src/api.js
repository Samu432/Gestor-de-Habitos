// Cliente API para comunicarse con el backend de FastAPI

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'firststep_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Helper genérico para peticiones HTTP
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    let errorMessage = 'Ocurrió un error en la solicitud';
    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err) => `${err.field ? err.field + ': ' : ''}${err.message}`).join(' | ');
      }
    }
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  // Autenticación
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  // Panel Hoy y Escalera Semanal
  getToday: () => request('/today'),
  getWeek: () => request('/week'),

  // Hábitos
  getHabits: () => request('/habits'),
  createHabit: (payload) => request('/habits', { method: 'POST', body: JSON.stringify(payload) }),
  updateHabit: (id, payload) => request(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  completeHabit: (id) => request(`/habits/${id}/complete`, { method: 'POST' }),
  uncompleteHabit: (id) => request(`/habits/${id}/complete`, { method: 'DELETE' }),

  // Perfil y Recompensas
  getMe: () => request('/me'),
  updateRewards: (payload) => request('/me/rewards', { method: 'PUT', body: JSON.stringify(payload) }),
  getAchievements: () => request('/achievements'),
};

