import api from './api';
import { Supply, PurchasePayload } from '../types';

export const inventoryService = {
  getAll: async (): Promise<Supply[]> => {
    const response = await api.get('/inventory');
    return response.data;
  },

  create: async (supply: Partial<Supply>) => {
    const response = await api.post('/inventory', supply);
    return response.data;
  },

  registerPurchase: async (data: PurchasePayload) => {
    const response = await api.post('/inventory/purchase', data);
    return response.data;
  }
};