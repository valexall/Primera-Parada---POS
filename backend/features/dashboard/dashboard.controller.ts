import { Request, Response } from 'express';
import * as DashboardService from './dashboard.service';

/**
 * DashboardController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/dashboard/summary
 * Obtiene el resumen diario del negocio
 */
export const getDailySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await DashboardService.getDailySummary();
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      error: error.message || 'Error calculando resumen diario'
    });
  }
};
