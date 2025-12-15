import express from 'express';
import { getSupplies, createSupply, registerPurchase } from '../controllers/inventoryController';

const router = express.Router();

router.get('/', getSupplies);
router.post('/', createSupply);
router.post('/purchase', registerPurchase);

export default router;