import express from 'express';
import {
  getReceipt,
  getReceiptHistory
} from './receipts.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);


router.get('/history', getReceiptHistory);

router.get('/:saleId', getReceipt);

export default router;
