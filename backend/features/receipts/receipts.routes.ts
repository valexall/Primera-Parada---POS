import express from 'express';
import {
  getReceipt,
  getReceiptHistory
} from './receipts.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de recibos requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/receipts/history
 * Obtiene todos los recibos emitidos (historial)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:saleId para evitar conflictos
 */
router.get('/history', getReceiptHistory);

/**
 * GET /api/receipts/:saleId
 * Obtiene los datos completos del recibo para una venta específica
 */
router.get('/:saleId', getReceipt);

export default router;
