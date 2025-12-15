import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthState, User } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean; // <--- NUEVO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  
  // Iniciamos cargando en TRUE para esperar la verificación
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Intentar recuperar sesión
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setAuth({
        token: storedToken,
        user: JSON.parse(storedUser),
        isAuthenticated: true
      });
      // Restaurar el header de axios para que las peticiones funcionen
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    // Una vez verificado, terminamos la carga
    setLoading(false); 
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuth({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setAuth({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};