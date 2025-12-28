/**
 * Barrel export para el módulo de Recibos
 * Facilita las importaciones desde otros módulos
 */

export * from './receipts.types';
export * as ReceiptsService from './receipts.service';
export * as ReceiptsController from './receipts.controller';
export { default as receiptsRoutes } from './receipts.routes';
