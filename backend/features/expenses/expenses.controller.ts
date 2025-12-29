import { Request, Response } from 'express';
import * as ExpensesService from './expenses.service';
import type { CreateExpenseRequest } from './expenses.types';
import { asyncHandler } from '../../middleware/errorHandler';

/**
 * ExpensesController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/expenses/daily
 * Obtiene los gastos del día actual
 */
export const getDailyExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const expenses = await ExpensesService.getDailyExpenses();
  res.json(expenses);
});

/**
 * GET /api/expenses
 * Obtiene gastos con filtros opcionales
 */
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

/**
 * POST /api/expenses
 * Crea un nuevo gasto
 */
export const createExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const expenseData: CreateExpenseRequest = req.body;
  const newExpense = await ExpensesService.createExpense(expenseData);
  res.status(201).json(newExpense);
});
