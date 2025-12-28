import { Request, Response } from 'express';
import * as MenuService from './menu.service';
import type { CreateMenuItemRequest, UpdateMenuItemRequest, ToggleAvailabilityRequest } from './menu.types';

/**
 * MenuController - Capa HTTP para el menú
 */

/**
 * GET /api/menu
 * Obtiene todos los items del menú
 */
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const menuItems = await MenuService.getAllMenuItems();
    res.json(menuItems);
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Error fetching menu' });
  }
};

/**
 * POST /api/menu
 * Agrega un nuevo item al menú
 */
export const addMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemData: CreateMenuItemRequest = req.body;
    const newItem = await MenuService.addMenuItem(itemData);
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error('Error adding menu item:', error);

    if (error.message.includes('required') || 
        error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error adding menu item' });
  }
};

/**
 * PUT /api/menu/:id
 * Actualiza un item del menú
 */
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateMenuItemRequest = req.body;
    const updatedItem = await MenuService.updateMenuItem(id, updates);
    res.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating menu item:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error.message.includes('required') || 
        error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error updating menu item' });
  }
};

/**
 * DELETE /api/menu/:id
 * Elimina un item del menú
 */
export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await MenuService.deleteMenuItem(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Error deleting menu item' });
  }
};

/**
 * GET /api/menu/stats/daily
 * Obtiene estadísticas diarias de platos vendidos
 */
export const getDailyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await MenuService.getDailyStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Error fetching daily stats' });
  }
};

/**
 * PATCH /api/menu/:id/availability
 * Cambia la disponibilidad de un item
 */
export const toggleAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_available }: ToggleAvailabilityRequest = req.body;

    if (is_available === undefined || is_available === null) {
      res.status(400).json({ error: 'is_available field is required' });
      return;
    }

    const updatedItem = await MenuService.toggleAvailability(id, is_available);
    res.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating availability:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error updating availability' });
  }
};
