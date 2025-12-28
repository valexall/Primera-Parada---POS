import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import type { LoginRequest, RegisterRequest } from './auth.types';

/**
 * AuthController - Capa HTTP para autenticación
 */

/**
 * POST /api/auth/login
 * Autentica un usuario y retorna un JWT
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials: LoginRequest = req.body;
    const result = await AuthService.loginUser(credentials);
    res.json(result);
  } catch (error: any) {
    console.error('Error in login:', error);

    // Credenciales inválidas
    if (error.message.includes('Credenciales inválidas') || error.message.includes('requeridos')) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error en el servidor' });
  }
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 * NOTA: En producción, proteger esta ruta con middleware de admin
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: RegisterRequest = req.body;
    const result = await AuthService.registerUser(userData);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in register:', error);

    // Errores de validación
    if (error.message.includes('requeridos') ||
        error.message.includes('caracteres') ||
        error.message.includes('Rol inválido') ||
        error.message.includes('ya está registrado')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error creando usuario' });
  }
};
