// FILE: frontend/services/api.ts
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants/api';

const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. INTERCEPTOR DE SOLICITUD (REQUEST)
// Inyecta el token automáticamente en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. INTERCEPTOR DE RESPUESTA (RESPONSE)
// Maneja errores globales, especialmente el 401 (Token vencido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado/Token vencido)
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o token inválido. Redirigiendo al login...');
      
      // Limpiamos el almacenamiento local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigimos forzosamente al login
      // Nota: Usamos window.location porque aquí no tenemos acceso al router de React
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Loguear error para desarrollo
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;