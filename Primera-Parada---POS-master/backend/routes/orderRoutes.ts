import express from 'express';
import { getOrders, getOrdersByStatus, createOrder, updateOrderStatus } from '../controllers/orderController';
const router = express.Router();
router.get('/', getOrders);
router.get('/status/:status', getOrdersByStatus);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
export default router;