// Rutas de la aplicación

export const ROUTES = {
  HOME: '/',
  MENU: '/',
  ORDERS: '/orders',
  KITCHEN: '/kitchen',
  CASHIER: '/cashier',   
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  USERS: '/users',
  HISTORY: '/history',
} as const;

export type RouteKey = keyof typeof ROUTES;

