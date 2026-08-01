// Tipos principales de la aplicación

// RF45 — Tipo de plato y categorías válidas
export type MenuCategory = 'Entradas' | 'Segundos' | 'Frituras' | 'Bebidas' | 'Postres' | 'Extras';

export const MENU_CATEGORIES: MenuCategory[] = ['Entradas', 'Segundos', 'Frituras', 'Bebidas', 'Postres', 'Extras'];

/** Badge color por categoría para UI */
export const CATEGORY_COLORS: Record<MenuCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Entradas:  { bg: 'bg-green-100',  text: 'text-green-700',  darkBg: 'dark:bg-green-900/30',  darkText: 'dark:text-green-400'  },
  Segundos:  { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
  Frituras:  { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  Bebidas:   { bg: 'bg-blue-100',   text: 'text-blue-700',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-400'   },
  Postres:   { bg: 'bg-pink-100',   text: 'text-pink-700',   darkBg: 'dark:bg-pink-900/30',   darkText: 'dark:text-pink-400'   },
  Extras:    { bg: 'bg-slate-100',  text: 'text-slate-600',  darkBg: 'dark:bg-slate-700',     darkText: 'dark:text-slate-300'  },
};

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: MenuCategory; // RF45
  is_available?: boolean; // TRUE = disponible, FALSE = agotado
  image_url?: string | null;
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

export type OrderStatus = 'Pendiente' | 'Listo' | 'Entregado' | 'Pagado';

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
  category: 'Servicios' | 'Personal' | 'Insumos' | 'Otros' | string;
  date?: string;
  created_at?: string;
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

export interface PaginatedExpensesResponse {
  data: Expense[];
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

export interface PaymentBreakdown {
  method: string;      // "Efectivo" | "Yape"
  total: number;       // monto total en S/.
  count: number;       // cantidad de ventas
  percentage: number;  // % del total
}
