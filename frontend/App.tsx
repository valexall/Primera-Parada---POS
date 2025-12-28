import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ROUTES } from './constants/routes';
import { Toaster } from 'react-hot-toast'; // <--- IMPORTANTE

// Importación de Páginas
import MenuPage from './pages/MenuPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import CashierPage from './pages/CashierPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import RegisterUserPage from './pages/RegisterUserPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import MenuHistoryPage from './pages/MenuHistoryPage';

export function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          {/* CONFIGURACIÓN DE ALERTAS (TOASTS) */}
          <Toaster 
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: '#1e293b', // slate-800
                color: '#fff',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '16px 24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' }, // Verde Esmeralda
                duration: 3000,
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' }, // Rojo
                duration: 4000,
              },
            }}
          />

        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path={ROUTES.MENU} element={<MenuPage />} />
                  <Route path={ROUTES.ORDERS} element={<OrderPage />} />
                  <Route path={ROUTES.KITCHEN} element={<KitchenPage />} />
                  <Route path={ROUTES.CASHIER} element={<CashierPage />} />
                  <Route path={ROUTES.HISTORY} element={<HistoryPage />} />

                  {/* Rutas Admin */}
                  <Route path={ROUTES.DASHBOARD} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path={ROUTES.INVENTORY} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  } />

                  <Route path={ROUTES.USERS} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <RegisterUserPage />
                    </ProtectedRoute>
                  } />

                  <Route path={ROUTES.MENU_HISTORY} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <MenuHistoryPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}