/**
 * Barrel export para el módulo de Historial de Menú
 * Facilita las importaciones desde otros módulos
 */

export * from './menu-history.types';
export * as MenuHistoryService from './menu-history.service';
export * as MenuHistoryController from './menu-history.controller';
export { default as menuHistoryRoutes } from './menu-history.routes';
