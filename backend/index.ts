import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// ✅ Importar desde la nueva arquitectura de features (Vertical Slices)
import authRoutes from './features/auth/auth.routes';
import menuRoutes from './features/menu/menu.routes';
import orderRoutes from './features/orders/order.routes';
import salesRoutes from './features/sales/sales.routes';
import expensesRoutes from './features/expenses/expenses.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import inventoryRoutes from './features/inventory/inventory.routes';
import receiptRoutes from './features/receipts/receipts.routes';
import menuHistoryRoutes from './features/menu-history/menu-history.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ✅ Routes - Todas desde features/
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/menu-history', menuHistoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running'
  });
});
// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!'
  });
});
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