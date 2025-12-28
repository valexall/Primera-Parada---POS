import { supabase } from '../../config/supabase';
import type { DailySummary } from './dashboard.types';

/**
 * DashboardService - Lógica de negocio para Dashboard
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 * Optimizado: Delega cálculos de agregación a PostgreSQL mediante RPC
 */

/**
 * Obtiene la fecha del día actual en formato YYYY-MM-DD
 */
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

  // Llamar a la función RPC de PostgreSQL que hace todas las agregaciones
  const { data, error } = await supabase.rpc('get_daily_summary', {
    target_date: targetDate
  });

  if (error) {
    throw new Error(`Error fetching daily summary: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from get_daily_summary RPC');
  }

  // La función RPC ya devuelve el formato correcto
  return data as DailySummary;
};
