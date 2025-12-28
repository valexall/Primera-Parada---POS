import express from 'express';
import {
  getSalesHistory,
  createSale,
  createPartialSale
} from './sales.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de ventas requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/sales/history
 * Obtiene el historial de ventas con filtros opcionales
 */
router.get('/history', getSalesHistory);

/**
 * POST /api/sales
 * Crea una nueva venta completa
 */
router.post('/', createSale);

/**
 * POST /api/sales/partial
 * Crea una venta parcial (solo algunos items de la orden)
 */
router.post('/partial', createPartialSale);

export default router;
