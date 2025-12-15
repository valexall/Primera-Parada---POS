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
    
    // 1. Registrar movimiento
    const { error: moveError } = await supabase
      .from('supply_movements')
      .insert([{
        supply_id: supplyId,
        type: 'Compra',
        quantity,
        cost,
        description: description || 'Compra de reposición'
      }]);
    
    if (moveError) throw moveError;

    // 2. Registrar Gasto Automáticamente (Integración con Finanzas)
    // Buscamos el nombre del insumo para la descripción del gasto
    const { data: supply } = await supabase.from('supplies').select('name').eq('id', supplyId).single();
    
    await supabase.from('expenses').insert([{
        description: `Compra Insumo: ${supply?.name}`,
        amount: cost,
        category: 'Insumos'
    }]);

    // 3. Actualizar Stock Actual (RPC function es ideal, pero haremos update directo por simplicidad)
    // Nota: En producción usar una función RPC de supabase para atomicidad
    const { data: currentData } = await supabase
        .from('supplies')
        .select('current_stock')
        .eq('id', supplyId)
        .single();
    
    const newStock = (currentData?.current_stock || 0) + Number(quantity);

    const { data: updatedSupply, error: updateError } = await supabase
      .from('supplies')
      .update({ current_stock: newStock })
      .eq('id', supplyId)
      .select()
      .single();

    if (updateError) throw updateError;
    
    res.json(updatedSupply);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error registrando compra' });
  }
};