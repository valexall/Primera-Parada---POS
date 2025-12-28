import api from './api';
import { Expense, DailySummary, Sale, PartialSaleRequest, SalesHistoryResponse } from '../types';

export const financeService = {
  // Ventas
  createSale: async (orderId: string, amount: number, paymentMethod: string, isReceiptIssued: boolean) => {
    const response = await api.post('/sales', { orderId, amount, paymentMethod, isReceiptIssued });
    return response.data;
  },

  // Ventas parciales
  createPartialSale: async (request: PartialSaleRequest) => {
    const response = await api.post('/sales/partial', request);
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
  },

  // Obtener historial con paginación
  getSalesHistory: async (
    startDate: string, 
    endDate: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<SalesHistoryResponse> => {
    const response = await api.get(`/sales/history?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`);
    return response.data;
  }

};