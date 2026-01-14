import { Request, Response } from 'express';
import * as MenuHistoryService from './menu-history.service';
import type { GenerateSnapshotRequest } from './menu-history.types';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler';

/**
 * MenuHistoryController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * POST /api/menu-history/snapshot
 * Genera o actualiza un snapshot del menú para una fecha específica
 */
export const generateSnapshot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const snapshotData: GenerateSnapshotRequest = req.body;
  const result = await MenuHistoryService.generateSnapshot(snapshotData);
  res.json(result);
});

/**
 * GET /api/menu-history/snapshots
 * Obtiene todos los snapshots con paginación y filtros
 */
export const getSnapshots = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, startDate, endDate } = req.query;
  
  const pageNumber = page ? parseInt(page as string) : undefined;
  const limitNumber = limit ? parseInt(limit as string) : undefined;
  
  if (pageNumber && pageNumber < 1) {
    throw new ValidationError('El número de página debe ser mayor a 0');
  }
  
  if (limitNumber && limitNumber < 1) {
    throw new ValidationError('El límite debe ser mayor a 0');
  }
  
  const filters = {
    page: pageNumber,
    limit: limitNumber,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const result = await MenuHistoryService.getSnapshots(filters);
  res.json(result);
});

/**
 * GET /api/menu-history/snapshots/:date
 * Obtiene un snapshot específico por fecha
 */
export const getSnapshotByDate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { date } = req.params;
  const snapshot = await MenuHistoryService.getSnapshotByDate(date);
  res.json(snapshot);
});

/**
 * DELETE /api/menu-history/snapshots/:id
 * Elimina un snapshot
 */
export const deleteSnapshot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await MenuHistoryService.deleteSnapshot(id);
  res.json({ message: 'Snapshot eliminado' });
});

/**
 * GET /api/menu-history/top-selling
 * Obtiene los items más vendidos en un rango de fechas
 */
export const getTopSellingItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, limit } = req.query;
  
  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined
  };

  const topItems = await MenuHistoryService.getTopSellingItems(filters);
  res.json(topItems);
});

/**
 * GET /api/menu-history/revenue-trends
 * Obtiene tendencias de ventas a lo largo del tiempo
 */
export const getRevenueTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const trends = await MenuHistoryService.getRevenueTrends(filters);
  res.json(trends);
});

/**
 * GET /api/menu-history/category-performance
 * Obtiene el rendimiento por categorías de menú
 */
export const getCategoryPerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const performance = await MenuHistoryService.getCategoryPerformance(filters);
  res.json(performance);
});

/**
 * GET /api/menu-history/hourly-pattern
 * Obtiene patrones de ventas por hora
 */
export const getHourlySalesPattern = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const pattern = await MenuHistoryService.getHourlySalesPattern(filters);
  res.json(pattern);
});

/**
 * GET /api/menu-history/compare/:currentDate
 * Compara snapshots (día actual vs día anterior o fecha específica)
 */
export const compareSnapshots = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { currentDate } = req.params;
  const { previousDate } = req.query;
  
  const comparison = await MenuHistoryService.compareSnapshots(
    currentDate,
    previousDate as string | undefined
  );
  
  // Return null if no comparison available instead of throwing error
  res.json(comparison);
});
