/**
 * Types para el módulo de Gastos
 * Representa la estructura de datos entre el backend y frontend
 */

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
}

/**
 * DTOs (Data Transfer Objects) para requests
 */

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category: string;
}

export interface ExpenseFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
}
