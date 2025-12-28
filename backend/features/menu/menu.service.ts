import { supabase } from '../../config/supabase';
import type { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest, DailyMenuStats } from './menu.types';

/**
 * MenuService - Lógica de negocio para el menú
 */

/**
 * Obtiene todos los items del menú
 */
export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching menu: ${error.message}`);
  }

  return data || [];
};

/**
 * Agrega un nuevo item al menú
 */
export const addMenuItem = async (itemData: CreateMenuItemRequest): Promise<MenuItem> => {
  const { name, price } = itemData;

  // Validaciones
  if (!name || price === undefined || price === null) {
    throw new Error('Name and price are required');
  }

  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Price must be a positive number');
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Name must be a non-empty string');
  }

  const { data, error } = await supabase
    .from('menu_items')
    .insert([{
      name: name.trim(),
      price: parseFloat(price.toString())
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error adding menu item: ${error.message}`);
  }

  return data;
};

/**
 * Actualiza un item del menú
 */
export const updateMenuItem = async (id: string, updates: UpdateMenuItemRequest): Promise<MenuItem> => {
  if (!id) {
    throw new Error('Menu item ID is required');
  }

  const updateData: { name?: string; price?: number } = {};

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
      throw new Error('Name must be a non-empty string');
    }
    updateData.name = updates.name.trim();
  }

  if (updates.price !== undefined) {
    if (typeof updates.price !== 'number' || updates.price <= 0) {
      throw new Error('Price must be a positive number');
    }
    updateData.price = parseFloat(updates.price.toString());
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('At least one field (name or price) must be provided');
  }

  const { data, error } = await supabase
    .from('menu_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating menu item: ${error.message}`);
  }

  if (!data) {
    throw new Error('Menu item not found');
  }

  return data;
};

/**
 * Elimina un item del menú
 */
export const deleteMenuItem = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Menu item ID is required');
  }

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting menu item: ${error.message}`);
  }
};

/**
 * Obtiene estadísticas diarias de platos vendidos
 */
export const getDailyStats = async (): Promise<DailyMenuStats[]> => {
  // Obtener el inicio del día actual
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = startOfDay.getTime();

  // Obtener órdenes del día con estado "Entregado"
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'Entregado')
    .gte('timestamp', startTimestamp);

  if (ordersError) {
    throw new Error(`Error fetching orders: ${ordersError.message}`);
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map(o => o.id);

  // Obtener items de esas órdenes
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('menu_item_id, menu_item_name, quantity')
    .in('order_id', orderIds);

  if (itemsError) {
    throw new Error(`Error fetching order items: ${itemsError.message}`);
  }

  // Agrupar y sumar cantidades por plato
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

  // Convertir a array y ordenar por cantidad descendente
  return Array.from(statsMap.values()).sort((a, b) => b.quantity - a.quantity);
};

/**
 * Cambia la disponibilidad de un item del menú
 */
export const toggleAvailability = async (id: string, isAvailable: boolean): Promise<MenuItem> => {
  if (!id) {
    throw new Error('Menu item ID is required');
  }

  if (typeof isAvailable !== 'boolean') {
    throw new Error('is_available must be a boolean');
  }

  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating availability: ${error.message}`);
  }

  if (!data) {
    throw new Error('Menu item not found');
  }

  return data;
};
