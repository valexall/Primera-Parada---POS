import { Request, Response } from 'express';
import * as SalesService from './sales.service';
import type { CreateSaleRequest, CreatePartialSaleRequest } from './sales.types';

/**
 * SalesController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/sales/history
 * Obtiene el historial de ventas con filtros opcionales
 */
export const getSalesHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    };

    const sales = await SalesService.getSalesHistory(filters);
    res.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo historial de ventas'
    });
  }
};

/**
 * POST /api/sales
 * Crea una nueva venta completa
 */
export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const saleData: CreateSaleRequest = req.body;
    const newSale = await SalesService.createSale(saleData);
    res.status(201).json(newSale);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('Faltan datos') ||
        error.message.includes('no encontrada')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error al registrar la venta'
    });
  }
};

/**
 * POST /api/sales/partial
 * Crea una venta parcial (solo algunos items de la orden)
 */
export const createPartialSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const partialSaleData: CreatePartialSaleRequest = req.body;
    const result = await SalesService.createPartialSale(partialSaleData);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating partial sale:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('Faltan datos') ||
        error.message.includes('no encontrada') ||
        error.message.includes('inválida')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Not found
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error al registrar la venta parcial'
    });
  }
};
