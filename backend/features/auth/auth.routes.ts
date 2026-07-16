import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  register,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  changeOwnPassword,
  toggleUserStatus,
  deleteUser,
  forgotPassword,
  setSecurityQuestion,
  getSecurityQuestion,
  resetPasswordWithQuestion
} from './auth.controller';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware';

const router = express.Router();


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: {
    error: 'Demasiados intentos de login',
    message: 'Por seguridad, tu IP ha sido bloqueada temporalmente. Intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos de registro',
    message: 'Intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para cambio de contraseña propio (más estricto)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Demasiados intentos de cambio de contraseña',
    message: 'Por seguridad, espera 15 minutos antes de intentarlo de nuevo.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


router.post('/login', loginLimiter, login);


router.post('/register', registerLimiter, register);

// Recuperación de contraseña desde la página de login (pública)
router.post('/forgot-password', changePasswordLimiter, forgotPassword);

// --- RF01: Pregunta de seguridad ---
// Pública: obtener la pregunta de un email (no expone respuesta)
router.get('/security-question', changePasswordLimiter, getSecurityQuestion);
// Pública: restablecer contraseña respondiendo la pregunta
router.post('/reset-with-question', changePasswordLimiter, resetPasswordWithQuestion);
// Protegida: configurar/actualizar la propia pregunta de seguridad
router.put('/me/security-question', verifyToken, setSecurityQuestion);

// Cambio de contraseña propio (cualquier usuario autenticado)
router.put('/me/password', verifyToken, changePasswordLimiter, changeOwnPassword);


router.get('/users', verifyToken, verifyAdmin, getAllUsers);


router.get('/users/:id', verifyToken, verifyAdmin, getUserById);

router.put('/users/:id', verifyToken, verifyAdmin, updateUser);

router.put('/users/:id/password', verifyToken, verifyAdmin, updateUserPassword);

router.patch('/users/:id/status', verifyToken, verifyAdmin, toggleUserStatus);

router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);

export default router;
