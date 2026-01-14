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

/**
 * GET /api/auth/users
 * Obtiene todos los usuarios
 * SOLO ADMIN
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const users = await AuthService.getAllUsers();
  res.json(users);
});

/**
 * GET /api/auth/users/:id
 * Obtiene un usuario por ID
 * SOLO ADMIN
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await AuthService.getUserById(id);
  res.json(user);
});

/**
 * PUT /api/auth/users/:id
 * Actualiza un usuario
 * SOLO ADMIN
 */
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;
  const result = await AuthService.updateUser(id, updates);
  res.json(result);
});

/**
 * PUT /api/auth/users/:id/password
 * Actualiza la contraseña de un usuario
 * SOLO ADMIN
 */
export const updateUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { password } = req.body;
  const result = await AuthService.updateUserPassword(id, password);
  res.json(result);
});

/**
 * PATCH /api/auth/users/:id/status
 * Activa o desactiva un usuario
 * SOLO ADMIN
 */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_active } = req.body;
  const result = await AuthService.toggleUserStatus(id, is_active);
  res.json(result);
});

/**
 * DELETE /api/auth/users/:id
 * Elimina un usuario
 * SOLO ADMIN
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await AuthService.deleteUser(id);
  res.json(result);
});

