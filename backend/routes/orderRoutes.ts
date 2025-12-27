import express from 'express';
import { getOrders, getOrdersByStatus, createOrder, updateOrderStatus, updateOrderItems, deleteOrder } from '../controllers/orderController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todo el router protegido para usuarios logueados
router.use(verifyToken);

router.get('/', getOrders);
router.get('/status/:status', getOrdersByStatus);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/items', updateOrderItems);
router.delete('/:id', deleteOrder);

export default router;