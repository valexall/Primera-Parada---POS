/**
 * Types para el módulo de Inventario
 * Representa la estructura de datos entre el backend y frontend
 */

export interface Supply {
  id: string;
  name: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  created_at: string;
}

/**
 * DTOs (Data Transfer Objects) para requests
 */

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
