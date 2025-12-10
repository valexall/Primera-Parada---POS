import express from 'express';
import { createSale } from '../controllers/salesController';
const router = express.Router();
router.post('/', createSale);
export default router;