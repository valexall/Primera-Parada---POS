import express from 'express';
import multer from 'multer';
import {
  getMenu,
  getPublicMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDailyStats,
  toggleAvailability,
  uploadImage,
  deleteImage,
} from './menu.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Multer con almacenamiento en memoria (el buffer se envía directo a Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB — límite también a nivel de multer
});

// RF46 — Ruta pública sin autenticación (DEBE ir antes de router.use(verifyToken))
router.get('/public', getPublicMenu);

router.use(verifyToken);

router.get('/daily-stats', getDailyStats);

router.get('/', getMenu);

router.post('/', addMenuItem);

router.put('/:id', updateMenuItem);

router.delete('/:id', deleteMenuItem);

router.patch('/:id/availability', toggleAvailability);

// RF12 — Gestión de imágenes del menú
router.post('/:id/image', upload.single('image'), uploadImage);
router.delete('/:id/image', deleteImage);

export default router;
