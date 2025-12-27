import api from './api';
import { 
  MenuHistorySnapshot, 
  MenuHistoryResponse, 
  TopSellingItem, 
  RevenueTrend 
} from '../types';

export const menuHistoryService = {
  // Generate or update snapshot for a specific date
  generateSnapshot: async (date?: string, notes?: string): Promise<MenuHistorySnapshot | null> => {
    try {
      const response = await api.post('/menu-history/generate', { date, notes });
      return response.data.data;
    } catch (error) {
      console.error('Error generating snapshot:', error);
      return null;
    }
  },

  // Get all snapshots with pagination and filters
  getSnapshots: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<MenuHistoryResponse | null> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await api.get(`/menu-history?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      return null;
    }
  },

  // Get snapshot by specific date
  getSnapshotByDate: async (date: string): Promise<MenuHistorySnapshot | null> => {
    try {
      const response = await api.get(`/menu-history/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching snapshot by date:', error);
      return null;
    }
  },

  // Delete a snapshot
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/menu-history/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      return false;
    }
  },

  // Get top selling items
  getTopSellingItems: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TopSellingItem[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get(`/menu-history/analytics/top-selling?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top selling items:', error);
      return [];
    }
  },

  // Get revenue trends
  getRevenueTrends: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueTrend[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await api.get(`/menu-history/analytics/revenue-trends?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue trends:', error);
      return [];
    }
  }
};
