import express from 'express';
import { getDailyExpenses, createExpense } from '../controllers/expensesController';
const router = express.Router();
router.get('/', getDailyExpenses);
router.post('/', createExpense);
export default router;