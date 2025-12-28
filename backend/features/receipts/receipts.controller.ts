import { Request, Response } from 'express';
import * as ReceiptsService from './receipts.service';

/**
 * ReceiptsController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/receipts/:saleId
 * Obtiene los datos completos del recibo para una venta específica
 */
export const getReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saleId } = req.params;
    const receipt = await ReceiptsService.getReceipt(saleId);
    res.json(receipt);
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Not found
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error al obtener el recibo'
    });
  }
};

/**
 * GET /api/receipts/history
 * Obtiene todos los recibos emitidos (historial)
 */
export const getReceiptHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      limit: limit ? Number(limit) : undefined
    };

    const receipts = await ReceiptsService.getReceiptHistory(filters);
    res.json(receipts);
  } catch (error: any) {
    console.error('Error fetching receipt history:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener historial de recibos'
    });
  }
};
