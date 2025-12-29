import { Request, Response } from 'express';
import * as MenuService from './menu.service';
import type { CreateMenuItemRequest, UpdateMenuItemRequest, ToggleAvailabilityRequest } from './menu.types';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';

/**
 * MenuController - Capa HTTP para el menú
 */

/**
 * GET /api/menu
 * Obtiene todos los items del menú
 */
export const getMenu = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const menuItems = await MenuService.getAllMenuItems();
  res.json(menuItems);
});

/**
 * POST /api/menu
 * Agrega un nuevo item al menú
 */
export const addMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const itemData: CreateMenuItemRequest = req.body;
  const newItem = await MenuService.addMenuItem(itemData);
  res.status(201).json(newItem);
});

/**
 * PUT /api/menu/:id
 * Actualiza un item del menú
 */
export const updateMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates: UpdateMenuItemRequest = req.body;
  const updatedItem = await MenuService.updateMenuItem(id, updates);
  res.json(updatedItem);
});

/**
 * DELETE /api/menu/:id
 * Elimina un item del menú
 */
export const deleteMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await MenuService.deleteMenuItem(id);
  res.status(204).send();
});

/**
 * GET /api/menu/stats/daily
 * Obtiene estadísticas diarias de platos vendidos
 */
export const getDailyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await MenuService.getDailyStats();
  res.json(stats);
});

/**
 * PATCH /api/menu/:id/availability
 * Cambia la disponibilidad de un item
 */
export const toggleAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_available }: ToggleAvailabilityRequest = req.body;

  if (is_available === undefined || is_available === null) {
    throw new ValidationError('El campo is_available es requerido');
  }

  const updatedItem = await MenuService.toggleAvailability(id, is_available);
  res.json(updatedItem);
});

