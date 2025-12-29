import { Request, Response } from 'express';
import * as SalesService from './sales.service';
import type { CreateSaleRequest, CreatePartialSaleRequest } from './sales.types';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';

/**
 * SalesController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/sales/history
 * Obtiene el historial de ventas con filtros opcionales y paginación
 */
export const getSalesHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, page, limit } = req.query;
  
  // Parsear parámetros de paginación con valores por defecto
  const pageNumber = page ? parseInt(page as string, 10) : 1;
  const limitNumber = limit ? parseInt(limit as string, 10) : 20;
  
  // Validar parámetros de paginación
  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new ValidationError('Page debe ser un número mayor a 0');
  }
  
  if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    throw new ValidationError('Limit debe estar entre 1 y 100');
  }
  
  const result = await SalesService.getSalesHistory({
    startDate: startDate as string,
    endDate: endDate as string,
    page: pageNumber,
    limit: limitNumber
  });
  
  res.json(result);
});

/**
 * POST /api/sales
 * Crea una nueva venta completa
 */
export const createSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const saleData: CreateSaleRequest = req.body;
  const newSale = await SalesService.createSale(saleData);
  res.status(201).json(newSale);
});

/**
 * POST /api/sales/partial
 * Crea una venta parcial (solo algunos items de la orden)
 */
export const createPartialSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const partialSaleData: CreatePartialSaleRequest = req.body;
  const result = await SalesService.createPartialSale(partialSaleData);
  res.status(201).json(result);
});
