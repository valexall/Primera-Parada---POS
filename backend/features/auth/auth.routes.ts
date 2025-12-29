import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register } from './auth.controller';

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

export default router;
