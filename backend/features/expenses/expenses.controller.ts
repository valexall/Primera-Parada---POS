import { Request, Response } from 'express';
import * as ExpensesService from './expenses.service';
import type { CreateExpenseRequest } from './expenses.types';

/**
 * ExpensesController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/expenses/daily
 * Obtiene los gastos del día actual
 */
export const getDailyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const expenses = await ExpensesService.getDailyExpenses();
    res.json(expenses);
  } catch (error: any) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo gastos del día'
    });
  }
};

/**
 * GET /api/expenses
 * Obtiene gastos con filtros opcionales
 */
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, startDate, endDate } = req.query;
    
    const filters = {
      date: date as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    };

    const expenses = await ExpensesService.getExpenses(filters);
    res.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo gastos'
    });
  }
};

/**
 * POST /api/expenses
 * Crea un nuevo gasto
 */
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expenseData: CreateExpenseRequest = req.body;
    const newExpense = await ExpensesService.createExpense(expenseData);
    res.status(201).json(newExpense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('Faltan datos')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error registrando gasto'
    });
  }
};
