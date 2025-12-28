/**
 * Types para el módulo de Historial de Menú
 * Representa la estructura de datos entre el backend y frontend
 */

export interface MenuSnapshot {
  id: string;
  snapshot_date: string;
  menu_items: MenuItem[];
  sales_stats: SalesStats[];
  total_revenue: number;
  total_orders: number;
  total_items_sold: number;
  dine_in_orders: number;
  takeaway_orders: number;
  avg_order_value: number;
  peak_hour: number | null;
  notes: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}

export interface SalesStats {
  menu_item_id: string;
  name: string;
  price: number;
  quantity_sold: number;
  revenue: number;
  times_ordered: number;
}

export interface TopSellingItem {
  menu_item_id: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
  times_ordered: number;
}

export interface RevenueTrend {
  snapshot_date: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

/**
 * DTOs (Data Transfer Objects) para requests
 */

export interface GenerateSnapshotRequest {
  date?: string;
  notes?: string;
}

export interface SnapshotFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface TopSellingFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface RevenueTrendFilters {
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number | null;
    totalPages: number;
  };
}
