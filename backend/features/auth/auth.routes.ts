import express from 'express';
import { login, register } from './auth.controller';

const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticación de usuarios
 */
router.post('/login', login);

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios
 * ⚠️ IMPORTANTE: En producción, proteger esta ruta (solo admin)
 */
router.post('/register', register);

export default router;
