import { Request, Response } from 'express';
import * as SalesService from './sales.service';
import type { CreateSaleRequest, CreatePartialSaleRequest } from './sales.types';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';


export const getSalesHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, page, limit } = req.query;

  const pageNumber = page ? parseInt(page as string, 10) : 1;
  const limitNumber = limit ? parseInt(limit as string, 10) : 20;

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

export const createSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const saleData: CreateSaleRequest = req.body;
  const newSale = await SalesService.createSale(saleData);
  res.status(201).json(newSale);
});

export const createPartialSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const partialSaleData: CreatePartialSaleRequest = req.body;
  const result = await SalesService.createPartialSale(partialSaleData);
  res.status(201).json(result);
});
