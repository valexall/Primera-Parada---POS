/**
 * Barrel export para el módulo de Dashboard
 * Facilita las importaciones desde otros módulos
 */

export * from './dashboard.types';
export * as DashboardService from './dashboard.service';
export * as DashboardController from './dashboard.controller';
export { default as dashboardRoutes } from './dashboard.routes';
