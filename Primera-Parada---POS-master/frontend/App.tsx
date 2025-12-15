import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './constants/routes';

// Importación de Páginas
import MenuPage from './pages/MenuPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import CashierPage from './pages/CashierPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import RegisterUserPage from './pages/RegisterUserPage'; // Importar nueva página
import LoginPage from './pages/LoginPage';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* RUTA PÚBLICA: LOGIN (Sin Sidebar) */}
          <Route path="/login" element={<LoginPage />} />

          {/* RUTAS PRIVADAS (Con Sidebar) */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path={ROUTES.MENU} element={<MenuPage />} />
                  <Route path={ROUTES.ORDERS} element={<OrderPage />} />
                  <Route path={ROUTES.KITCHEN} element={<KitchenPage />} />
                  <Route path={ROUTES.CASHIER} element={<CashierPage />} />

                  {/* Rutas Admin (Solo Dueña) */}
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
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}