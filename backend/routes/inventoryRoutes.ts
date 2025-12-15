import express from 'express';
import { getSupplies, createSupply, registerPurchase } from '../controllers/inventoryController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken, verifyAdmin); // Doble protección

router.get('/', getSupplies);
router.post('/', createSupply);
router.post('/purchase', registerPurchase);

export default router;