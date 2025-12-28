import { supabase } from '../../config/supabase';
import type { Expense, CreateExpenseRequest, ExpenseFilters } from './expenses.types';

/**
 * ExpensesService - Lógica de negocio para Gastos
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 */

/**
 * Obtiene los gastos del día actual
 */
export const getDailyExpenses = async (): Promise<Expense[]> => {
  // Obtener fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }

  return data || [];
};

/**
 * Obtiene gastos con filtros opcionales
 */
export const getExpenses = async (filters: ExpenseFilters): Promise<Expense[]> => {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.date) {
    query = query
      .gte('created_at', `${filters.date}T00:00:00`)
      .lte('created_at', `${filters.date}T23:59:59`);
  } else if (filters.startDate && filters.endDate) {
    query = query
      .gte('created_at', `${filters.startDate}T00:00:00`)
      .lte('created_at', `${filters.endDate}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }

  return data || [];
};

/**
 * Crea un nuevo gasto
 */
export const createExpense = async (expenseData: CreateExpenseRequest): Promise<Expense> => {
  const { description, amount, category } = expenseData;

  if (!description || !amount || !category) {
    throw new Error('Faltan datos requeridos');
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ description, amount, category }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating expense: ${error.message}`);
  }

  return data;
};
