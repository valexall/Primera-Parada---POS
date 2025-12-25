import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MenuIcon, ClipboardIcon, ChefHatIcon, DollarSignIcon, 
  PieChartIcon, PackageIcon, LogOutIcon, UsersIcon, LayoutGridIcon, XIcon 
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
  
  // Estado para controlar el menú lateral en móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinkClass = (path: string) => {
    const active = location.pathname === path;
    return `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
      ${active 
        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 font-bold' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
    `;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Contenido del menú de navegación (Reutilizable)
  const NavLinks = () => (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase px-4 mb-2 tracking-wider">Operación</div>
      <Link to={ROUTES.MENU} className={getLinkClass(ROUTES.MENU)} onClick={() => setIsMobileMenuOpen(false)}>
        <MenuIcon size={20} /> Menú del Día
      </Link>
      <Link to={ROUTES.ORDERS} className={getLinkClass(ROUTES.ORDERS)} onClick={() => setIsMobileMenuOpen(false)}>
        <ClipboardIcon size={20} /> Tomar Pedido
      </Link>
      <Link to={ROUTES.KITCHEN} className={getLinkClass(ROUTES.KITCHEN)} onClick={() => setIsMobileMenuOpen(false)}>
        <ChefHatIcon size={20} /> Cocina
      </Link>
      <Link to={ROUTES.CASHIER} className={getLinkClass(ROUTES.CASHIER)} onClick={() => setIsMobileMenuOpen(false)}>
        <DollarSignIcon size={20} /> Caja
      </Link>

      {user?.role === 'admin' && (
        <>
          <div className="text-xs font-bold text-slate-400 uppercase px-4 mt-8 mb-2 tracking-wider">Gerencia</div>
          <Link to={ROUTES.DASHBOARD} className={getLinkClass(ROUTES.DASHBOARD)} onClick={() => setIsMobileMenuOpen(false)}>
            <PieChartIcon size={20} /> Finanzas
          </Link>
          <Link to={ROUTES.INVENTORY} className={getLinkClass(ROUTES.INVENTORY)} onClick={() => setIsMobileMenuOpen(false)}>
            <PackageIcon size={20} /> Inventario
          </Link>
          <Link to={ROUTES.USERS} className={getLinkClass(ROUTES.USERS)} onClick={() => setIsMobileMenuOpen(false)}>
            <UsersIcon size={20} /> Usuarios
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* --- SIDEBAR (Solo Desktop - Fijo) --- */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col p-6 fixed h-full z-20">
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
          <NavLinks />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-bold">
            <LogOutIcon size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- MENU LATERAL MOVIL (Drawer) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Fondo oscuro backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Panel deslizante */}
          <nav className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-md">
                  <LayoutGridIcon size={18} />
                </div>
                <h1 className="text-lg font-bold text-slate-800">Menú</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-500">
                <XIcon size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              <NavLinks />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'Administrador' : 'Personal'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-500 bg-red-50 font-bold text-sm">
                <LogOutIcon size={18} /> Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 md:ml-72 flex flex-col h-full w-full relative">
        
        {/* Header Móvil (Sticky) */}
        <div className="md:hidden bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Botón Hamburguesa */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform">
              <MenuIcon size={24} />
            </button>
            <h1 className="font-bold text-slate-800 text-lg">Primera Parada</h1>
          </div>
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm border border-amber-200">
             {user?.name.charAt(0)}
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 w-full h-full overflow-y-auto md:overflow-hidden p-4 md:p-8 pb-28 md:pb-8 touch-pan-y">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>

        {/* --- BOTTOM BAR (Solo Móvil - Accesos Rápidos) --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
           <Link to={ROUTES.ORDERS} className={`flex flex-col items-center justify-center p-1 rounded-xl w-16 h-14 transition-colors ${location.pathname === ROUTES.ORDERS ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <ClipboardIcon size={22} strokeWidth={location.pathname === ROUTES.ORDERS ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">Pedido</span>
           </Link>
           <Link to={ROUTES.KITCHEN} className={`flex flex-col items-center justify-center p-1 rounded-xl w-16 h-14 transition-colors ${location.pathname === ROUTES.KITCHEN ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <ChefHatIcon size={22} strokeWidth={location.pathname === ROUTES.KITCHEN ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">Cocina</span>
           </Link>
           <Link to={ROUTES.CASHIER} className={`flex flex-col items-center justify-center p-1 rounded-xl w-16 h-14 transition-colors ${location.pathname === ROUTES.CASHIER ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
              <DollarSignIcon size={22} strokeWidth={location.pathname === ROUTES.CASHIER ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">Caja</span>
           </Link>
           {/* Si es admin, mostramos Dashboard en acceso rápido, si no, Menú */}
           {user?.role === 'admin' ? (
             <Link to={ROUTES.DASHBOARD} className={`flex flex-col items-center justify-center p-1 rounded-xl w-16 h-14 transition-colors ${location.pathname === ROUTES.DASHBOARD ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
                <PieChartIcon size={22} strokeWidth={location.pathname === ROUTES.DASHBOARD ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Admin</span>
             </Link>
           ) : (
             <Link to={ROUTES.MENU} className={`flex flex-col items-center justify-center p-1 rounded-xl w-16 h-14 transition-colors ${location.pathname === ROUTES.MENU ? 'text-amber-600 bg-amber-50' : 'text-slate-400'}`}>
                <MenuIcon size={22} strokeWidth={location.pathname === ROUTES.MENU ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Menú</span>
             </Link>
           )}
        </nav>
      </main>
    </div>
  );
};

export default Layout;