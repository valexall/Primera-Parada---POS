import express from 'express';
import {
  getOrders,
  getOrdersByStatus,
  createOrder,
  updateOrderStatus,
  updateOrderItems,
  deleteOrder,
  getOrderHistory
} from './order.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de órdenes requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/orders
 * Obtiene todas las órdenes
 */
router.get('/', getOrders);

/**
 * GET /api/orders/history
 * Obtiene el historial de órdenes
 * IMPORTANTE: Esta ruta debe ir ANTES de /status/:status para evitar conflictos
 */
router.get('/history', getOrderHistory);

/**
 * GET /api/orders/status/:status
 * Obtiene órdenes filtradas por estado
 */
router.get('/status/:status', getOrdersByStatus);

/**
 * POST /api/orders
 * Crea una nueva orden
 */
router.post('/', createOrder);

/**
 * PUT /api/orders/:id/status
 * Actualiza el estado de una orden
 */
router.put('/:id/status', updateOrderStatus);

/**
 * PUT /api/orders/:id/items
 * Actualiza los items de una orden
 */
router.put('/:id/items', updateOrderItems);

/**
 * DELETE /api/orders/:id
 * Elimina una orden
 */
router.delete('/:id', deleteOrder);

export default router;
