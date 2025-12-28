/**
 * Barrel export para el módulo de Inventario
 * Facilita las importaciones desde otros módulos
 */

export * from './inventory.types';
export * as InventoryService from './inventory.service';
export * as InventoryController from './inventory.controller';
export { default as inventoryRoutes } from './inventory.routes';
