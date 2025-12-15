import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth(); // Obtenemos loading

  // 1. Si está verificando sesión, mostramos una pantalla de carga o nada
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-amber-600 font-semibold animate-pulse">Cargando...</div>
      </div>
    );
  }

  // 2. Si terminó de cargar y NO está autenticado, ahí sí lo sacamos
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Verificación de roles (igual que antes)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;