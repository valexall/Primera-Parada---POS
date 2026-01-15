import express from 'express';
import {
  getOrders,
  getOrdersByStatus,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderItems,
  updateOrderItemStatus,
  deleteOrder,
  getOrderHistory
} from './order.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);

router.get('/', getOrders);

router.get('/history', getOrderHistory);

router.get('/status/:status', getOrdersByStatus);

router.get('/:id', getOrderById);

router.post('/', createOrder);

router.put('/:id/status', updateOrderStatus);

router.put('/:id/items', updateOrderItems);

router.patch('/:orderId/items/:itemId/status', updateOrderItemStatus);

router.delete('/:id', deleteOrder);

export default router;
