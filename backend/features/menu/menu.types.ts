
// RF45 — Tipos de platos
export type MenuCategory = 'Entradas' | 'Segundos' | 'Frituras' | 'Bebidas' | 'Postres' | 'Extras';

export const VALID_CATEGORIES: MenuCategory[] = ['Entradas', 'Segundos', 'Frituras', 'Bebidas', 'Postres', 'Extras'];

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  is_available: boolean;
  image_url?: string | null;
  created_at?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  category?: MenuCategory;
  image_url?: string | null;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  category?: MenuCategory;
  image_url?: string | null;
}

export interface ToggleAvailabilityRequest {
  is_available: boolean;
}

export interface DailyMenuStats {
  name: string;
  quantity: number;
}
