import express from 'express';
import {
  getSupplies,
  createSupply,
  registerPurchase
} from './inventory.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);


router.get('/', getSupplies);

router.get('/supplies', getSupplies);

router.post('/supplies', createSupply);

router.post('/purchase', registerPurchase);

export default router;
