import express from 'express';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware'; // Importar middlewares

const router = express.Router();

// GET público (cualquiera puede ver el menú)
router.get('/', getMenu);

// Rutas protegidas (Solo Admin)
router.post('/', verifyToken, verifyAdmin, addMenuItem);
router.put('/:id', verifyToken, verifyAdmin, updateMenuItem);
router.delete('/:id', verifyToken, verifyAdmin, deleteMenuItem);

export default router;