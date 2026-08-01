import { supabase } from '../../config/supabase';
import type { DailySummary } from './dashboard.types';


/**
 * Obtiene la fecha actual en la zona horaria de Perú (-05:00)
 */
const getTodayDatePeru = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
};

/**
 * Obtiene el resumen diario del negocio en horario local de Perú
 * @returns {Promise<DailySummary>} Resumen diario con ventas, gastos y desglose
 */
export const getDailySummary = async (): Promise<DailySummary> => {
  const targetDate = getTodayDatePeru();
  const startTimestamp = `${targetDate}T00:00:00.000-05:00`;
  const endTimestamp = `${targetDate}T23:59:59.999-05:00`;

  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('total_amount, payment_method')
    .gte('created_at', startTimestamp)
    .lte('created_at', endTimestamp);

  if (salesError) {
    throw new Error(`Error fetching daily sales: ${salesError.message}`);
  }

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('created_at', startTimestamp)
    .lte('created_at', endTimestamp);

  if (expensesError) {
    throw new Error(`Error fetching daily expenses: ${expensesError.message}`);
  }

  const totalSales = Math.round((sales || []).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) * 100) / 100;
  const totalExpenses = Math.round((expenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0) * 100) / 100;
  const cash = Math.round((sales || [])
    .filter(s => s.payment_method === 'Efectivo')
    .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) * 100) / 100;
  const yape = Math.round((sales || [])
    .filter(s => s.payment_method === 'Yape')
    .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) * 100) / 100;

  const netIncome = Math.round((totalSales - totalExpenses) * 100) / 100;

  return {
    date: targetDate,
    totalSales,
    totalExpenses,
    netIncome,
    breakdown: {
      cash,
      yape
    }
  };
};
