import { Request, Response } from 'express';
import * as DashboardService from './dashboard.service';
import { asyncHandler } from '../../middleware/errorHandler';


export const getDailySummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const summary = await DashboardService.getDailySummary();
  res.json(summary);
});
