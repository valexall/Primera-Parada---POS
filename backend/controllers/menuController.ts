import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
export const getMenu = async (req: Request, res: Response) => {
  try {
    const {
      data,
      error
    } = await supabase.from('menu_items').select('*').order('created_at', {
      ascending: false
    });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      error: 'Error fetching menu'
    });
  }
};
export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      name,
      price
    } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        error: 'Name and price are required'
      });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({
        error: 'Price must be a positive number'
      });
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Name must be a non-empty string'
      });
    }
    const {
      data,
      error
    } = await supabase.from('menu_items').insert([{
      name: name.trim(),
      price: parseFloat(price.toString())
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({
      error: 'Error adding menu item'
    });
  }
};
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      id
    } = req.params;
    const {
      name,
      price
    } = req.body;
    if (!id) {
      return res.status(400).json({
        error: 'Menu item ID is required'
      });
    }
    const updateData: { name?: string; price?: number } = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Name must be a non-empty string'
        });
      }
      updateData.name = name.trim();
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({
          error: 'Price must be a positive number'
        });
      }
      updateData.price = parseFloat(price.toString());
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'At least one field (name or price) must be provided'
      });
    }
    const {
      data,
      error
    } = await supabase.from('menu_items').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Menu item not found'
      });
    }
    res.json(data);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      error: 'Error updating menu item'
    });
  }
};
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      id
    } = req.params;
    const {
      error
    } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      error: 'Error deleting menu item'
    });
  }
};

export const getDailyStats = async (req: Request, res: Response) => {
  try {
    // Obtener el inicio del día actual (00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    // Obtener todas las órdenes del día con estado "Entregado"
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'Entregado')
      .gte('timestamp', startTimestamp);

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);

    // Obtener todos los items de esas órdenes
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('menu_item_id, menu_item_name, quantity')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Agrupar y sumar las cantidades por plato
    const statsMap = new Map<string, { name: string; quantity: number }>();

    (orderItems || []).forEach(item => {
      const existing = statsMap.get(item.menu_item_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        statsMap.set(item.menu_item_id, {
          name: item.menu_item_name,
          quantity: item.quantity
        });
      }
    });

    // Convertir a array y ordenar por cantidad (descendente)
    const stats = Array.from(statsMap.values())
      .sort((a, b) => b.quantity - a.quantity);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({
      error: 'Error fetching daily stats'
    });
  }
};

export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (is_available === undefined || is_available === null) {
      return res.status(400).json({
        error: 'is_available field is required'
      });
    }

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({
        error: 'is_available must be a boolean'
      });
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Menu item not found'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating menu item availability:', error);
    res.status(500).json({
      error: 'Error updating availability'
    });
  }
};