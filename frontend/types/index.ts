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

