import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  login, 
  register, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  updateUserPassword, 
  toggleUserStatus, 
  deleteUser 
} from './auth.controller';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * ✅ PROTECCIÓN: Rate limiting para prevenir ataques de fuerza bruta
 * - 5 intentos por IP cada 15 minutos
 * - Headers personalizados para debugging
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por ventana
  message: {
    error: 'Demasiados intentos de login',
    message: 'Por seguridad, tu IP ha sido bloqueada temporalmente. Intenta en 15 minutos.'
  },
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false // Desactiva headers `X-RateLimit-*`
});

/**
 * Rate limiting más permisivo para registro (solo admin debería acceder)
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 registros por hora
  message: {
    error: 'Demasiados intentos de registro',
    message: 'Intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/login
 * Autenticación de usuarios
 * ✅ Protegido con rate limiting (5 intentos/15min)
 */
router.post('/login', loginLimiter, login);

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios
 * ⚠️ IMPORTANTE: En producción, proteger esta ruta (solo admin)
 * ✅ Protegido con rate limiting (10 intentos/hora)
 */
router.post('/register', registerLimiter, register);

/**
 * RUTAS DE ADMINISTRACIÓN DE USUARIOS
 * ✅ Protegidas con autenticación + rol admin
 */

// GET /api/auth/users - Listar todos los usuarios
router.get('/users', verifyToken, verifyAdmin, getAllUsers);

// GET /api/auth/users/:id - Obtener un usuario específico
router.get('/users/:id', verifyToken, verifyAdmin, getUserById);

// PUT /api/auth/users/:id - Actualizar usuario
router.put('/users/:id', verifyToken, verifyAdmin, updateUser);

// PUT /api/auth/users/:id/password - Actualizar contraseña
router.put('/users/:id/password', verifyToken, verifyAdmin, updateUserPassword);

// PATCH /api/auth/users/:id/status - Activar/desactivar usuario
router.patch('/users/:id/status', verifyToken, verifyAdmin, toggleUserStatus);

// DELETE /api/auth/users/:id - Eliminar usuario
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);

export default router;
