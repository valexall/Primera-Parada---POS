// backend/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// --- Helpers & Constantes ---

const getTodayRange = () => {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    start: `${today}T00:00:00`,
    end: `${today}T23:59:59`
  };
};

// Función genérica para sumar propiedades de un array de objetos
const calculateSum = <T>(data: T[] | null, key: keyof T): number => {
  return data?.reduce((sum, item) => sum + Number(item[key]), 0) || 0;
};

// --- Controller ---

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const { date, start, end } = getTodayRange();

    // 1. Ejecutar consultas en paralelo para mejorar rendimiento
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

    if (salesResult.error) throw salesResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const salesData = salesResult.data;
    const expensesData = expensesResult.data;

    // 2. Calcular totales generales
    const totalSales = calculateSum(salesData, 'total_amount');
    const totalExpenses = calculateSum(expensesData, 'amount');

    // 3. Calcular desglose por método de pago
    // Nota: Filtramos en memoria ya que tenemos los datos del día
    const salesByCash = calculateSum(
      salesData?.filter(s => s.payment_method === 'Efectivo'), 
      'total_amount'
    );

    const salesByYape = calculateSum(
      salesData?.filter(s => s.payment_method === 'Yape'), 
      'total_amount'
    );

    // 4. Respuesta
    res.json({
      date,
      totalSales,
      totalExpenses,
      netIncome: totalSales - totalExpenses,
      breakdown: {
        cash: salesByCash,
        yape: salesByYape
      }
    });

  } catch (error) {
    console.error('Error dashboard:', error);
    res.status(500).json({ error: 'Error calculando resumen diario' });
  }
};