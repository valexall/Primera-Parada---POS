import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Rutas organizadas por features (arquitectura Vertical Slice)
import authRoutes from './features/auth/auth.routes';
import menuRoutes from './features/menu/menu.routes';
import orderRoutes from './features/orders/order.routes';
import salesRoutes from './features/sales/sales.routes';
import expensesRoutes from './features/expenses/expenses.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import inventoryRoutes from './features/inventory/inventory.routes';
import receiptRoutes from './features/receipts/receipts.routes';
import menuHistoryRoutes from './features/menu-history/menu-history.routes';
import chatbotRoutes from './features/chatbot/chatbot.routes';

// Middleware centralizado de manejo de errores
import { errorHandler, notFoundHandler, errorMetrics } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Registro de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/menu-history', menuHistoryRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Métricas resumidas de errores (solo para debugging)
app.get('/api/metrics/errors', (req, res) => {
  const summary = errorMetrics.getSummary();
  res.json({
    timestamp: new Date().toISOString(),
    ...summary
  });
});

// Métricas detalladas de errores (uso interno)
app.get('/api/metrics/errors/full', (req, res) => {
  const fullMetrics = errorMetrics.getMetrics();
  res.json({
    timestamp: new Date().toISOString(),
    ...fullMetrics
  });
});

// Middleware 404: rutas no encontradas (debe ir antes del error handler)
app.use(notFoundHandler);

// Middleware global de errores (debe ser el último)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
    console.error(`\nPara solucionarlo, puedes:`);
    console.error(`1. Detener el proceso que usa el puerto:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}`);
    console.error(`   Luego: taskkill /PID <PID> /F`);
    console.error(`2. O usar otro puerto:`);
    console.error(`   PORT=3002 npm run dev`);
    process.exit(1);
  } else {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
});
