import express from 'express';
import { createSale, getSalesHistory } from '../controllers/salesController';
const router = express.Router();
router.post('/', createSale);
router.get('/history', getSalesHistory);
export default router;