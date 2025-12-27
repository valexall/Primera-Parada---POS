import express from 'express';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem, getDailyStats, toggleAvailability } from '../controllers/menuController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware'; // Importar middlewares

const router = express.Router();

// GET público (cualquiera puede ver el menú)
router.get('/', getMenu);

// GET estadísticas diarias (accesible para usuarios autenticados)
router.get('/daily-stats', verifyToken, getDailyStats);

// Rutas protegidas (Solo Admin)
router.post('/', verifyToken, verifyAdmin, addMenuItem);
router.put('/:id', verifyToken, verifyAdmin, updateMenuItem);
router.put('/:id/availability', verifyToken, verifyAdmin, toggleAvailability);
router.delete('/:id', verifyToken, verifyAdmin, deleteMenuItem);

export default router;