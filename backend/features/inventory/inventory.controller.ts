import { Request, Response } from 'express';
import * as InventoryService from './inventory.service';
import type { CreateSupplyRequest, RegisterPurchaseRequest } from './inventory.types';

/**
 * InventoryController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/inventory/supplies
 * Obtiene lista de insumos
 */
export const getSupplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplies = await InventoryService.getSupplies();
    res.json(supplies);
  } catch (error: any) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener inventario'
    });
  }
};

/**
 * POST /api/inventory/supplies
 * Registra un insumo nuevo
 */
export const createSupply = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplyData: CreateSupplyRequest = req.body;
    const newSupply = await InventoryService.createSupply(supplyData);
    res.status(201).json(newSupply);
  } catch (error: any) {
    console.error('Error creating supply:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('Faltan datos')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error creando insumo'
    });
  }
};

/**
 * POST /api/inventory/purchase
 * Registra compra (aumenta stock)
 */
export const registerPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const purchaseData: RegisterPurchaseRequest = req.body;
    await InventoryService.registerPurchase(purchaseData);
    res.json({ message: 'Compra registrada exitosamente' });
  } catch (error: any) {
    console.error('Error registering purchase:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('Faltan datos')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Not found
    if (error.message.includes('no encontrado')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error registrando compra'
    });
  }
};
