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
