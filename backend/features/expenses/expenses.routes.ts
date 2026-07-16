import express from 'express';
import {
  getDailyExpenses,
  getExpenses,
  createExpense
} from './expenses.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);


router.get('/daily', getDailyExpenses);


router.get('/', getExpenses);

router.post('/', createExpense);

export default router;
