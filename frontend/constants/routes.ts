 
export const ROUTES = {
  HOME: '/',
  MENU: '/',
  ORDERS: '/orders',
  KITCHEN: '/kitchen',
  CASHIER: '/cashier',   
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  USERS: '/users',
  USER_MANAGEMENT: '/user-management',
  HISTORY: '/history',
  MENU_HISTORY: '/menu-history',
  PUBLIC_MENU: '/menu-publico', // RF46 — Acceso sin login
} as const;

export type RouteKey = keyof typeof ROUTES;


