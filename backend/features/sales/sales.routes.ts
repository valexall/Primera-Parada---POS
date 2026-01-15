import express from 'express';
import {
  getSalesHistory,
  createSale,
  createPartialSale
} from './sales.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);

router.get('/history', getSalesHistory);

router.post('/', createSale);

router.post('/partial', createPartialSale);

export default router;
