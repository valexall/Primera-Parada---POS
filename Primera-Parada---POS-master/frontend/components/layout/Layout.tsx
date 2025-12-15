import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Agregado useNavigate
import { 
  MenuIcon, 
  ClipboardIcon, 
  ChefHatIcon, 
  DollarSignIcon, 
  PieChartIcon, 
  PackageIcon, 
  LogOutIcon,
  UsersIcon // Agregado ícono para usuarios
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook para redirección
  const { user, logout } = useAuth(); // Hook de autenticación

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-amber-100 text-amber-800' 
      : 'text-gray-600 hover:bg-amber-50';
  };

  // Función para cerrar sesión y redirigir
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-amber-600">Primera Parada</h1>
        </div>

        {/* Navegación */}
        <nav className="p-2 flex-1 overflow-y-auto">
          <ul>
            {/* --- Accesible para TODOS (Moza y Dueña) --- */}
            <li className="mb-1">
              <Link to={ROUTES.MENU} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.MENU)}`}>
                <MenuIcon className="mr-3 h-5 w-5" />
                <span>Menú del Día</span>
              </Link>
            </li>
            <li className="mb-1">
              <Link to={ROUTES.ORDERS} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.ORDERS)}`}>
                <ClipboardIcon className="mr-3 h-5 w-5" />
                <span>Tomar Pedido</span>
              </Link>
            </li>
            <li className="mb-1">
              <Link to={ROUTES.KITCHEN} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.KITCHEN)}`}>
                <ChefHatIcon className="mr-3 h-5 w-5" />
                <span>Cocina</span>
              </Link>
            </li>
            <li className="mb-1">
              <Link to={ROUTES.CASHIER} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.CASHIER)}`}>
                <DollarSignIcon className="mr-3 h-5 w-5" />
                <span>Caja</span>
              </Link>
            </li>

            {/* --- Accesible SOLO para ADMIN (Dueña) --- */}
            {user?.role === 'admin' && (
              <>
                <div className="my-2 border-t border-gray-200"></div>
                <p className="px-3 text-xs font-semibold text-gray-400 mb-1">ADMINISTRACIÓN</p>
                
                <li className="mb-1">
                  <Link to={ROUTES.DASHBOARD} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.DASHBOARD)}`}>
                    <PieChartIcon className="mr-3 h-5 w-5" />
                    <span>Finanzas</span>
                  </Link>
                </li>
                <li className="mb-1">
                  <Link to={ROUTES.INVENTORY} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.INVENTORY)}`}>
                    <PackageIcon className="mr-3 h-5 w-5" />
                    <span>Inventario</span>
                  </Link>
                </li>
                <li className="mb-1">
                  <Link to={ROUTES.USERS} className={`flex items-center p-3 rounded-md ${isActive(ROUTES.USERS)}`}>
                    <UsersIcon className="mr-3 h-5 w-5" />
                    <span>Usuarios</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Footer del Sidebar con Usuario y Logout */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0">
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-2 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate" title={user?.name}>
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'admin' ? 'Dueña / Admin' : 'Moza'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOutIcon size={16} className="mr-2"/> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;