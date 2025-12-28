import express from 'express';
import {
  getSupplies,
  createSupply,
  registerPurchase
} from './inventory.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de inventario requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/inventory
 * Obtiene lista de insumos
 */
router.get('/', getSupplies);

/**
 * GET /api/inventory/supplies (alias)
 * Obtiene lista de insumos
 */
router.get('/supplies', getSupplies);

/**
 * POST /api/inventory/supplies
 * Registra un insumo nuevo
 */
router.post('/supplies', createSupply);

/**
 * POST /api/inventory/purchase
 * Registra compra (aumenta stock)
 */
router.post('/purchase', registerPurchase);

export default router;
