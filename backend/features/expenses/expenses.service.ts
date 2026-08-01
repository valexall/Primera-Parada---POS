import { supabase } from '../../config/supabase';
import type { Expense, CreateExpenseRequest, ExpenseFilters, PaginatedExpensesResponse } from './expenses.types';
import {
  ValidationError
} from '../../middleware/errorHandler';


export const getDailyExpenses = async (): Promise<Expense[]> => {

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('created_at', `${today}T00:00:00.000-05:00`)
    .lte('created_at', `${today}T23:59:59.999-05:00`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }

  return data || [];
};

export const getExpenses = async (filters: ExpenseFilters): Promise<PaginatedExpensesResponse> => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.date) {
    query = query
      .gte('created_at', `${filters.date}T00:00:00.000-05:00`)
      .lte('created_at', `${filters.date}T23:59:59.999-05:00`);
  } else if (filters.startDate && filters.endDate) {
    query = query
      .gte('created_at', `${filters.startDate}T00:00:00.000-05:00`)
      .lte('created_at', `${filters.endDate}T23:59:59.999-05:00`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }

  const total = count || 0;
  return {
    data: data || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const createExpense = async (expenseData: CreateExpenseRequest): Promise<Expense> => {
  const { description, amount, category = 'General' } = expenseData;

  if (!description || !amount) {
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
