// Rutas de la aplicación

export const ROUTES = {
  HOME: '/',
  MENU: '/',
  ORDERS: '/orders',
  KITCHEN: '/kitchen',
} as const;

export type RouteKey = keyof typeof ROUTES;

