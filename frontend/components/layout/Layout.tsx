import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MenuIcon, ClipboardIcon, ChefHatIcon, DollarSignIcon, 
  PieChartIcon, PackageIcon, LogOutIcon, UsersIcon, LayoutGridIcon 
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Estilo para links activos
  const getLinkClass = (path: string) => {
    const active = location.pathname === path;
    return `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 font-bold' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'}
    `;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <LayoutGridIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Primera Parada</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Restaurante</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          <div className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 tracking-wider">Operación</div>
          <Link to={ROUTES.MENU} className={getLinkClass(ROUTES.MENU)}>
            <MenuIcon size={20} /> Menú del Día
          </Link>
          <Link to={ROUTES.ORDERS} className={getLinkClass(ROUTES.ORDERS)}>
            <ClipboardIcon size={20} /> Tomar Pedido
          </Link>
          <Link to={ROUTES.KITCHEN} className={getLinkClass(ROUTES.KITCHEN)}>
            <ChefHatIcon size={20} /> Cocina
          </Link>
          <Link to={ROUTES.CASHIER} className={getLinkClass(ROUTES.CASHIER)}>
            <DollarSignIcon size={20} /> Caja
          </Link>

          {user?.role === 'admin' && (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase px-4 mt-8 mb-2 tracking-wider">Gerencia</div>
              <Link to={ROUTES.DASHBOARD} className={getLinkClass(ROUTES.DASHBOARD)}>
                <PieChartIcon size={20} /> Finanzas
              </Link>
              <Link to={ROUTES.INVENTORY} className={getLinkClass(ROUTES.INVENTORY)}>
                <PackageIcon size={20} /> Inventario
              </Link>
              <Link to={ROUTES.USERS} className={getLinkClass(ROUTES.USERS)}>
                <UsersIcon size={20} /> Usuarios
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'Administrador' : 'Personal'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-bold">
            <LogOutIcon size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden relative">
        {/* Header Móvil */}
        <div className="md:hidden bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-bold text-slate-800 text-lg">Primera Parada</h1>
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm border border-amber-200">
             {user?.name.charAt(0)}
          </div>
        </div>

        {/* Área Scrollable */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* --- BOTTOM BAR (Móvil) --- */}
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <Link to={ROUTES.ORDERS} className={`flex flex-col items-center p-2 rounded-xl w-16 transition-colors ${location.pathname === ROUTES.ORDERS ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <ClipboardIcon size={24} strokeWidth={location.pathname === ROUTES.ORDERS ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1">Pedido</span>
           </Link>
           <Link to={ROUTES.KITCHEN} className={`flex flex-col items-center p-2 rounded-xl w-16 transition-colors ${location.pathname === ROUTES.KITCHEN ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <ChefHatIcon size={24} strokeWidth={location.pathname === ROUTES.KITCHEN ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1">Cocina</span>
           </Link>
           <Link to={ROUTES.CASHIER} className={`flex flex-col items-center p-2 rounded-xl w-16 transition-colors ${location.pathname === ROUTES.CASHIER ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <DollarSignIcon size={24} strokeWidth={location.pathname === ROUTES.CASHIER ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1">Caja</span>
           </Link>
           <Link to={ROUTES.MENU} className={`flex flex-col items-center p-2 rounded-xl w-16 transition-colors ${location.pathname === ROUTES.MENU ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <MenuIcon size={24} strokeWidth={location.pathname === ROUTES.MENU ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1">Menú</span>
           </Link>
        </nav>
      </main>
    </div>
  );
};

export default Layout;