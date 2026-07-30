import { Request, Response } from 'express';
import * as MenuService from './menu.service';
import * as MenuImagesService from './menu-images.service';
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

// RF12 — Subir o reemplazar imagen de un plato del menú
export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.file) {
    throw new ValidationError('Se requiere un archivo de imagen');
  }

  // Obtener plato actual para eliminar imagen anterior si existe
  const currentItem = await MenuService.getMenuItemById(id);

  if (currentItem?.image_url) {
    try {
      await MenuImagesService.deleteMenuImage(currentItem.image_url);
    } catch (err) {
      // No bloquea el flujo si falla la eliminación de la imagen anterior
      console.warn('[uploadImage] No se pudo eliminar imagen anterior:', err);
    }
  }

  // Subir nueva imagen
  const publicUrl = await MenuImagesService.uploadMenuImage(req.file, id);

  // Guardar URL en la BD
  const updatedItem = await MenuService.updateMenuItem(id, { image_url: publicUrl });

  res.json(updatedItem);
});

// RF12 — Eliminar imagen de un plato del menú
export const deleteImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const currentItem = await MenuService.getMenuItemById(id);

  if (!currentItem) {
    throw new ValidationError('Plato no encontrado');
  }

  if (currentItem.image_url) {
    await MenuImagesService.deleteMenuImage(currentItem.image_url);
  }

  // Limpiar image_url en la BD
  const updatedItem = await MenuService.updateMenuItem(id, { image_url: null });

  res.json(updatedItem);
});

