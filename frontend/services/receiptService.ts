import api from './api';
import { Receipt } from '../types';

export const receiptService = {
  /**
   * Obtiene los datos del recibo para una venta específica
   */
  getReceipt: async (saleId: string): Promise<Receipt> => {
    const response = await api.get(`/receipts/${saleId}`);
    return response.data;
  },

  /**
   * Obtiene el historial de recibos emitidos
   */
  getReceiptHistory: async (startDate?: string, endDate?: string, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/receipts/history/all?${params.toString()}`);
    return response.data;
  }
};
