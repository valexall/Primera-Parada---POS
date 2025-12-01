import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuIcon, ClipboardIcon, ChefHatIcon } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const location = useLocation();
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-amber-50';
  };
  return <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-amber-600">Primera Parada</h1>
        </div>
        <nav className="p-2">
          <ul>
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
          </ul>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>;
};
export default Layout;