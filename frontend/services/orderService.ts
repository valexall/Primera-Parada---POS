import api from './api';
import { Order, OrderItem, OrderStatus } from '../types';

/**
 * Servicio para operaciones relacionadas con pedidos
 */
export const orderService = {
  /**
   * Obtiene todos los pedidos
   */
  getAll: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  /**
   * Obtiene pedidos filtrados por estado
   */
  getByStatus: async (status?: OrderStatus): Promise<Order[]> => {
    try {
      const endpoint = status ? `/orders/status/${status}` : '/orders/status/all';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }
  },

  /**
   * Crea un nuevo pedido
   */
  create: async (items: OrderItem[], tableNumber: string, orderType?: 'Dine-In' | 'Takeaway', customerName?: string): Promise<Order> => {
    try {
      const response = await api.post('/orders', { 
        items, 
        tableNumber, 
        orderType: orderType || 'Dine-In',
        customerName 
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un pedido
   */
  updateStatus: async (id: string, status: OrderStatus): Promise<Order | null> => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  },

  /**
   * Actualiza los items de un pedido
   */
  updateItems: async (id: string, items: OrderItem[]): Promise<Order> => {
    try {
      const response = await api.put(`/orders/${id}/items`, { items });
      return response.data;
    } catch (error) {
      console.error('Error updating order items:', error);
      throw error;
    }
  },
};

