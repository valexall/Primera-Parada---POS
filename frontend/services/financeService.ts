import api from './api';
import { Expense, DailySummary } from '../types';

export const financeService = {
  // Ventas
  createSale: async (orderId: string, amount: number, paymentMethod: string, isReceiptIssued: boolean) => {
    const response = await api.post('/sales', { orderId, amount, paymentMethod, isReceiptIssued });
    return response.data;
  },

  // Gastos
  getDailyExpenses: async (): Promise<Expense[]> => {
    const response = await api.get('/expenses');
    return response.data;
  },

  createExpense: async (expense: Partial<Expense>) => {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  // Dashboard
  getDailySummary: async (): Promise<DailySummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  }
};