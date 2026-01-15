import { Request, Response } from 'express';
import * as MenuHistoryService from './menu-history.service';
import type { GenerateSnapshotRequest } from './menu-history.types';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler';

export const generateSnapshot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const snapshotData: GenerateSnapshotRequest = req.body;
  const result = await MenuHistoryService.generateSnapshot(snapshotData);
  res.json(result);
});

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


export const getSnapshotByDate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { date } = req.params;
  const snapshot = await MenuHistoryService.getSnapshotByDate(date);
  res.json(snapshot);
});

export const deleteSnapshot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await MenuHistoryService.deleteSnapshot(id);
  res.json({ message: 'Snapshot eliminado' });
});

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

export const getRevenueTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const trends = await MenuHistoryService.getRevenueTrends(filters);
  res.json(trends);
});

export const getCategoryPerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const performance = await MenuHistoryService.getCategoryPerformance(filters);
  res.json(performance);
});

export const getHourlySalesPattern = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined
  };

  const pattern = await MenuHistoryService.getHourlySalesPattern(filters);
  res.json(pattern);
});

export const compareSnapshots = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { currentDate } = req.params;
  const { previousDate } = req.query;

  const comparison = await MenuHistoryService.compareSnapshots(
    currentDate,
    previousDate as string | undefined
  );

  res.json(comparison);
});
