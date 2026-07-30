
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  created_at?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  image_url?: string | null;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  image_url?: string | null;
}

export interface ToggleAvailabilityRequest {
  is_available: boolean;
}

export interface DailyMenuStats {
  name: string;
  quantity: number;
}
