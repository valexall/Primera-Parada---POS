import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MenuPage from './pages/MenuPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import { ROUTES } from './constants/routes';

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.ORDERS} element={<OrderPage />} />
          <Route path={ROUTES.KITCHEN} element={<KitchenPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}