/**
 * Barrel export para el módulo de Órdenes
 * Facilita las importaciones desde otros módulos
 */

export * from './order.types';
export * as OrderService from './order.service';
export * as OrderController from './order.controller';
export { default as orderRoutes } from './order.routes';
