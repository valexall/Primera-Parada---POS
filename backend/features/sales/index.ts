/**
 * Barrel export para el módulo de Ventas
 * Facilita las importaciones desde otros módulos
 */

export * from './sales.types';
export * as SalesService from './sales.service';
export * as SalesController from './sales.controller';
export { default as salesRoutes } from './sales.routes';
