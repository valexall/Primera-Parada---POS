import api from './api';
import { MenuItem } from '../types';

/**
 * Servicio para operaciones relacionadas con el menú
 */
export const menuService = {
  /**
   * Obtiene todos los items del menú
   */
  getAll: async (): Promise<MenuItem[]> => {
    try {
      const response = await api.get('/menu');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  },

  /**
   * Agrega un nuevo item al menú
   */
  create: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
    try {
      const response = await api.post('/menu', item);
      return response.data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return null;
    }
  },

  /**
   * Actualiza un item del menú
   */
  update: async (id: string, item: Partial<MenuItem>): Promise<MenuItem | null> => {
    try {
      const response = await api.put(`/menu/${id}`, item);
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return null;
    }
  },

  /**
   * Elimina un item del menú
   */
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/menu/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  },

  /**
   * Obtiene las estadísticas diarias de platos vendidos
   */
  getDailyStats: async (): Promise<{ name: string; quantity: number }[]> => {
    try {
      const response = await api.get('/menu/daily-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return [];
    }
  },
};

