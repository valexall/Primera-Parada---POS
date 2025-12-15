// backend/controllers/expensesController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getDailyExpenses = async (req: Request, res: Response) => {
  try {
    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error obteniendo gastos' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { description, amount, category } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ description, amount, category }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error registrando gasto' });
  }
};