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
   * Alias de compatibilidad para código legado
   */
  createMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
    return menuService.create(item);
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
   * Alias de compatibilidad para código legado
   */
  updateMenuItem: async (id: string, item: Partial<MenuItem>): Promise<MenuItem | null> => {
    return menuService.update(id, item);
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
   * Alias de compatibilidad para código legado
   */
  deleteMenuItem: async (id: string): Promise<boolean> => {
    return menuService.delete(id);
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

  /**
   * Actualiza la disponibilidad de un item del menú
   */
  toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem | null> => {
    try {
      const response = await api.put(`/menu/${id}/availability`, { is_available: isAvailable });
      return response.data;
    } catch (error) {
      console.error('Error updating availability:', error);
      return null;
    }
  },

  /**
   * RF12 — Sube o reemplaza la imagen de un plato del menú
   * Formatos válidos: JPG, PNG, WEBP — Máximo 2 MB
   */
  uploadImage: async (id: string, file: File): Promise<MenuItem | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/menu/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al subir imagen';
      throw new Error(msg);
    }
  },

  /**
   * RF12 — Elimina la imagen de un plato del menú
   */
  deleteImage: async (id: string): Promise<MenuItem | null> => {
    try {
      const response = await api.delete(`/menu/${id}/image`);
      return response.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar imagen';
      throw new Error(msg);
    }
  },
};
