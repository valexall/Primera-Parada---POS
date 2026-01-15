import { supabase } from '../../config/supabase';
import type { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest, DailyMenuStats } from './menu.types';
import {
  ValidationError,
  NotFoundError,
  ConflictError
} from '../../middleware/errorHandler';


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

export const addMenuItem = async (itemData: CreateMenuItemRequest): Promise<MenuItem> => {
  const { name, price } = itemData;

  if (!name || price === undefined || price === null) {
    throw new ValidationError('Nombre y precio son requeridos');
  }

  if (typeof price !== 'number' || price <= 0) {
    throw new ValidationError('El precio debe ser un número positivo');
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('El nombre debe ser un texto no vacío');
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
    if (error.code === '23505') {
      throw new ConflictError('Ya existe un ítem con ese nombre');
    }
    throw new Error(`Error adding menu item: ${error.message}`);
  }

  return data;
};

export const updateMenuItem = async (id: string, updates: UpdateMenuItemRequest): Promise<MenuItem> => {
  if (!id) {
    throw new ValidationError('El ID del ítem es requerido');
  }

  const updateData: { name?: string; price?: number } = {};

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
      throw new ValidationError('El nombre debe ser un texto no vacío');
    }
    updateData.name = updates.name.trim();
  }

  if (updates.price !== undefined) {
    if (typeof updates.price !== 'number' || updates.price <= 0) {
      throw new ValidationError('El precio debe ser un número positivo');
    }
    updateData.price = parseFloat(updates.price.toString());
  }

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('Debe proporcionar al menos un campo para actualizar (nombre o precio)');
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
    throw new NotFoundError(`Ítem del menú con ID ${id}`);
  }

  return data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  if (!id) {
    throw new ValidationError('El ID del ítem es requerido');
  }

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting menu item: ${error.message}`);
  }
};

export const getDailyStats = async (): Promise<DailyMenuStats[]> => {

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = startOfDay.getTime();

  const { data, error } = await supabase.rpc('get_daily_menu_stats', {
    start_timestamp: startTimestamp
  });

  if (error) {
    throw new Error(`Error fetching daily stats: ${error.message}`);
  }

  return data || [];
};

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
