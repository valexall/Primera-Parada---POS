import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import type { LoginRequest, RegisterRequest } from './auth.types';
import { asyncHandler } from '../../middleware/errorHandler';


export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const credentials: LoginRequest = req.body;
  const result = await AuthService.loginUser(credentials);
  res.json(result);
});


export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData: RegisterRequest = req.body;
  const result = await AuthService.registerUser(userData);
  res.status(201).json(result);
});


export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const users = await AuthService.getAllUsers();
  res.json(users);
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await AuthService.getUserById(id);
  res.json(user);
});


export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;
  const result = await AuthService.updateUser(id, updates);
  res.json(result);
});

export const updateUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { password } = req.body;
  const result = await AuthService.updateUserPassword(id, password);
  res.json(result);
});

export const changeOwnPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // El userId viene del token JWT, no de los params (seguridad)
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  const result = await AuthService.changeOwnPassword(userId, req.body);
  res.json(result);
});


export const toggleUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_active } = req.body;
  const result = await AuthService.toggleUserStatus(id, is_active);
  res.json(result);
});


export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await AuthService.deleteUser(id);
  res.json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const result = await AuthService.checkEmailForRecovery(email);
  // Siempre respondemos con 200 para no revelar qué emails existen
  res.json({
    message: result.exists
      ? 'Correo válido. Contacta al administrador del sistema para restablecer tu contraseña.'
      : 'Si el correo está registrado, el administrador podrá ayudarte a recuperar el acceso.',
    exists: result.exists
  });
});

// ============================================================
// RF01 — PREGUNTA DE SEGURIDAD
// ============================================================

/** Configura/actualiza la pregunta de seguridad del usuario autenticado */
export const setSecurityQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  if (!userId) { res.status(401).json({ error: 'No autenticado' }); return; }
  const result = await AuthService.setSecurityQuestion(userId, req.body);
  res.json(result);
});

/** Devuelve la pregunta de seguridad dado un email (pública) */
export const getSecurityQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query as { email: string };
  const result = await AuthService.getSecurityQuestion(email);
  res.json(result);
});

/** Restablece la contraseña verificando la respuesta secreta (pública) */
export const resetPasswordWithQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.resetPasswordWithQuestion(req.body);
  res.json(result);
});
