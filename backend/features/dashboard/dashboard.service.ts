import { supabase } from '../../config/supabase';
import type { DailySummary, SaleData, ExpenseData } from './dashboard.types';

/**
 * DashboardService - Lógica de negocio para Dashboard
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 */

/**
 * Obtiene el rango del día actual
 */
const getTodayRange = () => {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    start: `${today}T00:00:00`,
    end: `${today}T23:59:59`
  };
};

/**
 * Función genérica para sumar propiedades de un array de objetos
 */
const calculateSum = <T>(data: T[] | null, key: keyof T): number => {
  return data?.reduce((sum, item) => sum + Number(item[key]), 0) || 0;
};

/**
 * Obtiene el resumen diario del negocio
 */
export const getDailySummary = async (): Promise<DailySummary> => {
  const { date, start, end } = getTodayRange();

  // Ejecutar consultas en paralelo para mejorar rendimiento
  const [salesResult, expensesResult] = await Promise.all([
    supabase
      .from('sales')
      .select('total_amount, payment_method')
      .gte('created_at', start)
      .lte('created_at', end),
      
    supabase
      .from('expenses')
      .select('amount')
      .gte('created_at', start)
      .lte('created_at', end)
  ]);

  if (salesResult.error) {
    throw new Error(`Error fetching sales: ${salesResult.error.message}`);
  }

  if (expensesResult.error) {
    throw new Error(`Error fetching expenses: ${expensesResult.error.message}`);
  }

  const salesData = salesResult.data;
  const expensesData = expensesResult.data;

  // Calcular totales generales
  const totalSales = calculateSum(salesData, 'total_amount');
  const totalExpenses = calculateSum(expensesData, 'amount');

  // Calcular desglose por método de pago
  // Nota: Filtramos en memoria ya que tenemos los datos del día
  const salesByCash = calculateSum(
    salesData?.filter((s: SaleData) => s.payment_method === 'Efectivo'), 
    'total_amount'
  );

  const salesByYape = calculateSum(
    salesData?.filter((s: SaleData) => s.payment_method === 'Yape'), 
    'total_amount'
  );

  return {
    date,
    totalSales,
    totalExpenses,
    netIncome: totalSales - totalExpenses,
    breakdown: {
      cash: salesByCash,
      yape: salesByYape
    }
  };
};
