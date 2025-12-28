import express from 'express';
import { getDailySummary } from './dashboard.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * Todas las rutas de dashboard requieren autenticación
 */
router.use(verifyToken);

/**
 * GET /api/dashboard/summary
 * Obtiene el resumen diario del negocio
 */
router.get('/summary', getDailySummary);

export default router;
