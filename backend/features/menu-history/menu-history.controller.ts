import { Request, Response } from 'express';
import * as MenuHistoryService from './menu-history.service';
import type { GenerateSnapshotRequest } from './menu-history.types';

/**
 * MenuHistoryController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * POST /api/menu-history/snapshot
 * Genera o actualiza un snapshot del menú para una fecha específica
 */
export const generateSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const snapshotData: GenerateSnapshotRequest = req.body;
    const result = await MenuHistoryService.generateSnapshot(snapshotData);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating snapshot:', error);
    res.status(500).json({
      error: error.message || 'Error generando snapshot'
    });
  }
};

/**
 * GET /api/menu-history/snapshots
 * Obtiene todos los snapshots con paginación y filtros
 */
export const getSnapshots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, startDate, endDate } = req.query;
    
    const filters = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    };

    const result = await MenuHistoryService.getSnapshots(filters);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo snapshots'
    });
  }
};

/**
 * GET /api/menu-history/snapshots/:date
 * Obtiene un snapshot específico por fecha
 */
export const getSnapshotByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    const snapshot = await MenuHistoryService.getSnapshotByDate(date);
    res.json(snapshot);
  } catch (error: any) {
    console.error('Error fetching snapshot:', error);
    
    // Not found
    if (error.message.includes('no encontrado')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    res.status(500).json({
      error: error.message || 'Error obteniendo snapshot'
    });
  }
};

/**
 * DELETE /api/menu-history/snapshots/:id
 * Elimina un snapshot
 */
export const deleteSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await MenuHistoryService.deleteSnapshot(id);
    res.json({ message: 'Snapshot eliminado' });
  } catch (error: any) {
    console.error('Error deleting snapshot:', error);
    res.status(500).json({
      error: error.message || 'Error eliminando snapshot'
    });
  }
};

/**
 * GET /api/menu-history/top-selling
 * Obtiene los items más vendidos en un rango de fechas
 */
export const getTopSellingItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const topItems = await MenuHistoryService.getTopSellingItems(filters);
    res.json(topItems);
  } catch (error: any) {
    console.error('Error fetching top selling items:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo items más vendidos'
    });
  }
};

/**
 * GET /api/menu-history/revenue-trends
 * Obtiene tendencias de ventas a lo largo del tiempo
 */
export const getRevenueTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    };

    const trends = await MenuHistoryService.getRevenueTrends(filters);
    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo tendencias'
    });
  }
};
