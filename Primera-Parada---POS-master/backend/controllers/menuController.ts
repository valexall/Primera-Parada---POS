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