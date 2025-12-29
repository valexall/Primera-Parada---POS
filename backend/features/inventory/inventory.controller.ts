import { Request, Response } from 'express';
import * as InventoryService from './inventory.service';
import type { CreateSupplyRequest, RegisterPurchaseRequest } from './inventory.types';
import { asyncHandler } from '../../middleware/errorHandler';

/**
 * InventoryController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/inventory/supplies
 * Obtiene lista de insumos
 */
export const getSupplies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const supplies = await InventoryService.getSupplies();
  res.json(supplies);
});

/**
 * POST /api/inventory/supplies
 * Registra un insumo nuevo
 */
export const createSupply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const supplyData: CreateSupplyRequest = req.body;
  const newSupply = await InventoryService.createSupply(supplyData);
  res.status(201).json(newSupply);
});

/**
 * POST /api/inventory/purchase
 * Registra compra (aumenta stock)
 */
export const registerPurchase = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const purchaseData: RegisterPurchaseRequest = req.body;
  await InventoryService.registerPurchase(purchaseData);
  res.json({ message: 'Compra registrada exitosamente' });
});
