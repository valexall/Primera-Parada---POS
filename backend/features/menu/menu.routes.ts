import express from 'express';
import {
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDailyStats,
  toggleAvailability
} from './menu.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de menú requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/menu/daily-stats
 * Estadísticas diarias de ventas por plato
 * IMPORTANTE: Debe ir antes de /:id para evitar conflictos
 */
router.get('/daily-stats', getDailyStats);

/**
 * GET /api/menu
 * Obtiene todos los items del menú
 */
router.get('/', getMenu);

/**
 * POST /api/menu
 * Agrega un nuevo item al menú
 */
router.post('/', addMenuItem);

/**
 * PUT /api/menu/:id
 * Actualiza un item del menú
 */
router.put('/:id', updateMenuItem);

/**
 * DELETE /api/menu/:id
 * Elimina un item del menú
 */
router.delete('/:id', deleteMenuItem);

/**
 * PATCH /api/menu/:id/availability
 * Cambia la disponibilidad de un item
 */
router.patch('/:id/availability', toggleAvailability);

export default router;
