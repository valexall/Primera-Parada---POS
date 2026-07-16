import { Request, Response } from 'express';
import * as MenuService from './menu.service';
import type { CreateMenuItemRequest, UpdateMenuItemRequest, ToggleAvailabilityRequest } from './menu.types';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';


export const getMenu = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const menuItems = await MenuService.getAllMenuItems();
  res.json(menuItems);
});

export const addMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const itemData: CreateMenuItemRequest = req.body;
  const newItem = await MenuService.addMenuItem(itemData);
  res.status(201).json(newItem);
});

export const updateMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates: UpdateMenuItemRequest = req.body;
  const updatedItem = await MenuService.updateMenuItem(id, updates);
  res.json(updatedItem);
});

export const deleteMenuItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await MenuService.deleteMenuItem(id);
  res.status(204).send();
});

export const getDailyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await MenuService.getDailyStats();
  res.json(stats);
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_available }: ToggleAvailabilityRequest = req.body;

  if (is_available === undefined || is_available === null) {
    throw new ValidationError('El campo is_available es requerido');
  }

  const updatedItem = await MenuService.toggleAvailability(id, is_available);
  res.json(updatedItem);
});

