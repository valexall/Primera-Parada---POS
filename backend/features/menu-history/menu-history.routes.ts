import express from 'express';
import {
  generateSnapshot,
  getSnapshots,
  getSnapshotByDate,
  deleteSnapshot,
  getTopSellingItems,
  getRevenueTrends
} from './menu-history.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de menu-history requieren autenticación
 */
router.use(verifyToken);

/**
 * POST /api/menu-history/snapshot
 * Genera o actualiza un snapshot del menú para una fecha específica
 */
router.post('/snapshot', generateSnapshot);

/**
 * GET /api/menu-history
 * Obtiene todos los snapshots con paginación y filtros
 */
router.get('/', getSnapshots);

/**
 * GET /api/menu-history/snapshots (alias)
 * Obtiene todos los snapshots con paginación y filtros
 */
router.get('/snapshots', getSnapshots);

/**
 * GET /api/menu-history/analytics/top-selling
 * Obtiene los items más vendidos en un rango de fechas
 * IMPORTANTE: Esta ruta debe ir ANTES de /snapshots/:date para evitar conflictos
 */
router.get('/analytics/top-selling', getTopSellingItems);

/**
 * GET /api/menu-history/analytics/revenue-trends
 * Obtiene tendencias de ventas a lo largo del tiempo
 * IMPORTANTE: Esta ruta debe ir ANTES de /snapshots/:date para evitar conflictos
 */
router.get('/analytics/revenue-trends', getRevenueTrends);

/**
 * GET /api/menu-history/date/:date
 * Obtiene un snapshot específico por fecha
 */
router.get('/date/:date', getSnapshotByDate);

/**
 * DELETE /api/menu-history/snapshots/:id
 * Elimina un snapshot
 */
router.delete('/snapshots/:id', deleteSnapshot);

export default router;
