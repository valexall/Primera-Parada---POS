/**
 * Barrel export para el módulo de Gastos
 * Facilita las importaciones desde otros módulos
 */

export * from './expenses.types';
export * as ExpensesService from './expenses.service';
export * as ExpensesController from './expenses.controller';
export { default as expensesRoutes } from './expenses.routes';
