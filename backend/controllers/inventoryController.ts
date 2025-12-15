import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Obtener lista de insumos
export const getSupplies = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

// Registrar Insumo Nuevo
export const createSupply = async (req: Request, res: Response) => {
  try {
    const { name, unit, min_stock } = req.body;
    const { data, error } = await supabase
      .from('supplies')
      .insert([{ name, unit, min_stock, current_stock: 0 }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error creando insumo' });
  }
};

// Registrar Compra (Aumenta Stock)
export const registerPurchase = async (req: Request, res: Response) => {
  try {
    const { supplyId, quantity, cost, description } = req.body;
    
    // Obtenemos el nombre primero (necesario para el log de gastos)
    const { data: supply } = await supabase
        .from('supplies')
        .select('name')
        .eq('id', supplyId)
        .single();

    if (!supply) return res.status(404).json({ error: 'Insumo no encontrado' });

    // LLAMADA RPC TRANSACCIONAL
    const { error } = await supabase.rpc('register_purchase_transaction', {
      p_supply_id: supplyId,
      p_quantity: quantity,
      p_cost: cost,
      p_description: description || 'Compra de reposición',
      p_supply_name: supply.name
    });

    if (error) throw error;
    
    res.json({ message: 'Compra registrada exitosamente' });

  } catch (error) {
    console.error('Error RPC:', error);
    res.status(500).json({ error: 'Error registrando compra' });
  }
};