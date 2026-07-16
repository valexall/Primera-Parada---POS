import { Request, Response } from 'express';
import * as ExpensesService from './expenses.service';
import type { CreateExpenseRequest } from './expenses.types';
import { asyncHandler } from '../../middleware/errorHandler';


export const getDailyExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const expenses = await ExpensesService.getDailyExpenses();
  res.json(expenses);
});


export const getExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { date, startDate, endDate } = req.query;

  const filters = {
    date: date as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const expenses = await ExpensesService.getExpenses(filters);
  res.json(expenses);
});


export const createExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const expenseData: CreateExpenseRequest = req.body;
  const newExpense = await ExpensesService.createExpense(expenseData);
  res.status(201).json(newExpense);
});
