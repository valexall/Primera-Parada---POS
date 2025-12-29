import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import type { LoginRequest, RegisterRequest } from './auth.types';
import { asyncHandler } from '../../middleware/errorHandler';

/**
 * AuthController - Capa HTTP para autenticación
 */

/**
 * POST /api/auth/login
 * Autentica un usuario y retorna un JWT
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const credentials: LoginRequest = req.body;
  const result = await AuthService.loginUser(credentials);
  res.json(result);
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 * NOTA: En producción, proteger esta ruta con middleware de admin
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData: RegisterRequest = req.body;
  const result = await AuthService.registerUser(userData);
  res.status(201).json(result);
});

