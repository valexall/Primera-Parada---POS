/**
 * Types para el módulo de Ventas
 * Representa la estructura de datos entre el backend y frontend
 */

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

export interface Sale {
  id: string;
  order_id: string;
  payment_method: string;
  total_amount: number;
  is_receipt_issued: boolean;
  created_at: string;
}

export interface SaleWithOrder extends Sale {
  orders: {
    id: string;
    timestamp: number;
    table_number: string | null;
    order_type: string;
    customer_name: string | null;
    order_items: Array<{
      menu_item_name: string;
      quantity: number;
    }>;
  };
}

/**
 * DTOs (Data Transfer Objects) para requests
 */

export interface CreateSaleRequest {
  orderId: string;
  paymentMethod: string;
  amount: number;
  isReceiptIssued?: boolean;
}

export interface CreatePartialSaleRequest {
  orderId: string;
  paymentMethod: string;
  isReceiptIssued?: boolean;
  selectedItems: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface SalesHistoryFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PartialSaleResponse extends Sale {
  isPartialPayment: boolean;
  originalOrderId: string;
  partialOrderId: string;
}
