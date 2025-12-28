import express from 'express';
import {
  getDailyExpenses,
  getExpenses,
  createExpense
} from './expenses.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de gastos requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/expenses/daily
 * Obtiene los gastos del día actual
 */
router.get('/daily', getDailyExpenses);

/**
 * GET /api/expenses
 * Obtiene gastos con filtros opcionales
 */
router.get('/', getExpenses);

/**
 * POST /api/expenses
 * Crea un nuevo gasto
 */
router.post('/', createExpense);

export default router;
