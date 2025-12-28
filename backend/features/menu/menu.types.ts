/**
 * Types para el módulo de Menú
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  created_at?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
}

export interface ToggleAvailabilityRequest {
  is_available: boolean;
}

export interface DailyMenuStats {
  name: string;
  quantity: number;
}
