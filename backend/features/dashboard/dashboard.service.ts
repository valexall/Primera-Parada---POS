import { supabase } from '../../config/supabase';
import type { DailySummary } from './dashboard.types';


const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obtiene el resumen diario del negocio
 * Optimizado: Usa función RPC de PostgreSQL para delegar cálculos de agregación
 * @returns {Promise<DailySummary>} Resumen diario con ventas, gastos y desglose
 */
export const getDailySummary = async (): Promise<DailySummary> => {
  const targetDate = getTodayDate();

  const { data, error } = await supabase.rpc('get_daily_summary', {
    target_date: targetDate
  });

  if (error) {
    throw new Error(`Error fetching daily summary: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from get_daily_summary RPC');
  }

  return data as DailySummary;
};
