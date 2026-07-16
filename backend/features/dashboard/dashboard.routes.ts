import express from 'express';
import { getDailySummary } from './dashboard.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);

router.get('/summary', getDailySummary);

export default router;
