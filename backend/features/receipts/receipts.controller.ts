import { Request, Response } from 'express';
import * as ReceiptsService from './receipts.service';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';


export const getReceipt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { saleId } = req.params;
  const receipt = await ReceiptsService.getReceipt(saleId);
  res.json(receipt);
});

export const getReceiptHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, limit } = req.query;

  const filters = {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    limit: limit ? Number(limit) : undefined
  };

  const receipts = await ReceiptsService.getReceiptHistory(filters);
  res.json(receipts);
});
