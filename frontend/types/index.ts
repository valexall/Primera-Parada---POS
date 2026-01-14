// Tipos principales de la aplicación

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available?: boolean; // TRUE = disponible, FALSE = agotado
}

export interface OrderItem {
  id?: string; // ID del order_item en la BD (opcional, para actualizaciones)
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  notes?: string;
  itemStatus?: 'Pendiente' | 'Listo' | 'Entregado';
}

export type OrderStatus = 'Pendiente' | 'Listo' | 'Entregado';

export type OrderType = 'Dine-In' | 'Takeaway';

export interface Order {
  id: string;
  timestamp: number;
  status: OrderStatus;
  orderType?: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
}

export interface Sale {
  id: string;
  order_id: string;      
  total_amount: number; 
  payment_method: 'Efectivo' | 'Yape';
  created_at: string;
  is_receipt_issued?: boolean;
  orders?: {
    id: string;
    timestamp: number;
    table_number?: number;
    order_type?: OrderType;
    customer_name?: string;
    order_items: {
      menu_item_name: string;
      quantity: number;
    }[];
  };
}

export interface SelectedItem {
  menuItemId: string;
  quantity: number;
}

export interface PartialSaleRequest {
  orderId: string;
  paymentMethod: 'Efectivo' | 'Yape';
  isReceiptIssued?: boolean;
  selectedItems: SelectedItem[];
}

export interface Receipt {
  id: string;
  saleId: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Efectivo' | 'Yape';
  timestamp: string;
  receiptNumber: string;
}

export interface CompanyInfo {
  name: string;
  ruc?: string;
  address: string;
  phone?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'Servicios' | 'Personal' | 'Insumos' | 'Otros';
  date: string;
}

export interface DailySummary {
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  breakdown: {
    cash: number;
    yape: number;
  };
}

export interface SalesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SalesHistoryResponse {
  data: Sale[];
  pagination: SalesPagination;
}

export interface Supply {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
}

export interface PurchasePayload {
  supplyId: string;
  quantity: number;
  cost: number;
  description?: string;
}

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'waiter';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Menu History Types for Business Intelligence
export interface MenuItemSalesStats {
  menu_item_id: string;
  name: string;
  price: number;
  quantity_sold: number;
  revenue: number;
  times_ordered: number;
}

export interface MenuHistorySnapshot {
  id: string;
  snapshot_date: string; // YYYY-MM-DD
  menu_items: MenuItem[];
  sales_stats: MenuItemSalesStats[];
  total_revenue: number;
  total_orders: number;
  total_items_sold: number;
  dine_in_orders: number;
  takeaway_orders: number;
  avg_order_value: number;
  peak_hour: number | null; // 0-23
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MenuHistoryResponse {
  data: MenuHistorySnapshot[];
  pagination: MenuHistoryPagination;
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

export interface CategoryPerformance {
  category: string;
  total_quantity: number;
  total_revenue: number;
  items_count: number;
  avg_price: number;
  percentage_of_total: number;
}

export interface HourlySalesPattern {
  hour: number;
  orders_count: number;
  revenue: number;
  avg_order_value: number;
}

export interface DayComparison {
  previous_date: string;
  current_date: string;
  revenue_change: number;
  revenue_change_percent: number;
  orders_change: number;
  orders_change_percent: number;
  items_sold_change: number;
  items_sold_change_percent: number;
}
