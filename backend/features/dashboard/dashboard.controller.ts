import { Request, Response } from 'express';
import * as DashboardService from './dashboard.service';
import { asyncHandler } from '../../middleware/errorHandler';

/**
 * DashboardController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/dashboard/summary
 * Obtiene el resumen diario del negocio
 */
export const getDailySummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const summary = await DashboardService.getDailySummary();
  res.json(summary);
});
