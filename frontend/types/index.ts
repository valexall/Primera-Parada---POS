// Tipos principales de la aplicación

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  notes?: string;
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
