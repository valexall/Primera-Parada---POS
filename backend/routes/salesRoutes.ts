import express from 'express';
import { createSale, getSalesHistory, createPartialSale } from '../controllers/salesController';
const router = express.Router();
router.post('/', createSale);
router.post('/partial', createPartialSale);
router.get('/history', getSalesHistory);
export default router;