import { Request, Response } from 'express';
import * as ReceiptsService from './receipts.service';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler';

/**
 * ReceiptsController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/receipts/:saleId
 * Obtiene los datos completos del recibo para una venta específica
 */
export const getReceipt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { saleId } = req.params;
  const receipt = await ReceiptsService.getReceipt(saleId);
  res.json(receipt);
});

/**
 * GET /api/receipts/history
 * Obtiene todos los recibos emitidos (historial)
 */
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
