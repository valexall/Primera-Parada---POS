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

