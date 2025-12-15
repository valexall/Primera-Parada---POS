import express from 'express';
import { getDailySummary } from '../controllers/dashboardController';
const router = express.Router();
router.get('/summary', getDailySummary);
export default router;