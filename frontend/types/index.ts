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

export interface Order {
  id: string;
  timestamp: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface Sale {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Yape';
  date: string;
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
