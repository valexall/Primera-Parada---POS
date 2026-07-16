

export interface Supply {
  id: string;
  name: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  created_at: string;
}


export interface CreateSupplyRequest {
  name: string;
  unit: string;
  min_stock: number;
}

export interface RegisterPurchaseRequest {
  supplyId: string;
  quantity: number;
  cost: number;
  description?: string;
}
