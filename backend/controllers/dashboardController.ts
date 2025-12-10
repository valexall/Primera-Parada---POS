// backend/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Obtener total de ventas del día
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, payment_method')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (salesError) throw salesError;

    // 2. Obtener total de gastos del día
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (expensesError) throw expensesError;

    // 3. Calcular totales
    const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const totalExpenses = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    
    // Desglose por método de pago
    const salesByCash = salesData
      ?.filter(s => s.payment_method === 'Efectivo')
      .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      
    const salesByYape = salesData
      ?.filter(s => s.payment_method === 'Yape')
      .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

    res.json({
      date: today,
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