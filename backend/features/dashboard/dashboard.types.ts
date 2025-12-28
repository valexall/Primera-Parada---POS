/**
 * Types para el módulo de Dashboard
 * Representa la estructura de datos entre el backend y frontend
 */

export interface DailySummary {
  date: string;
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  breakdown: {
    cash: number;
    yape: number;
  };
}

export interface SaleData {
  total_amount: number;
  payment_method: string;
}

export interface ExpenseData {
  amount: number;
}
