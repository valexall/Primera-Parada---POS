
export interface Receipt {
  id: string;
  saleId: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  tableNumber: string | null;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface ReceiptItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  notes: string;
}

export interface ReceiptHistoryItem {
  id: string;
  saleId: string;
  receiptNumber: string;
  orderId: string;
  tableNumber: string | null;
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface ReceiptHistoryFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}


export interface DbReceipt {
  id: string;
  sale_id: string;
  receipt_number: string;
  order_id: string;
  table_number: string | null;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  payment_method: string;
  items: any[];
  issued_at: string;
}
