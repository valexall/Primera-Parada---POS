/**
 * Types para el módulo de Órdenes
 * Representa la estructura de datos entre el backend y frontend
 */

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  notes: string | null;
}

export interface Order {
  id: string;
  timestamp: number;
  status: 'Pendiente' | 'Listo' | 'Entregado' | 'Pagado';
  tableNumber: string | null;
  orderType: 'Dine-In' | 'Takeaway';
  customerName: string | null;
  items: OrderItem[];
}

/**
 * DTOs (Data Transfer Objects) para requests
 */

export interface CreateOrderRequest {
  items: OrderItem[];
  tableNumber?: string;
  orderType?: 'Dine-In' | 'Takeaway';
  customerName?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'Pendiente' | 'Listo' | 'Entregado' | 'Pagado';
}

export interface UpdateOrderItemsRequest {
  items: OrderItem[];
}

export interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Tipos internos de la base de datos (Supabase)
 * Representan la estructura raw de la BD
 */

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  price: number;
  quantity: number;
  notes: string | null;
}

export interface DbOrder {
  id: string;
  timestamp: number;
  status: string;
  table_number: string | null;
  order_type: 'Dine-In' | 'Takeaway';
  customer_name: string | null;
  order_items?: DbOrderItem[];
}
