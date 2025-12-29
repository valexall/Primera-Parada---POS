import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_cambiar_en_prod';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

/**
 * Middleware: Verificar autenticación mediante JWT
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer <token>

  if (!token) {
    throw new UnauthorizedError('Token de autenticación requerido');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err: any) {
    // Los errores de JWT serán manejados automáticamente por errorHandler
    throw err;
  }
};

/**
 * Middleware: Verificar rol de Administrador
 */
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Usuario no autenticado');
  }

  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Se requiere rol de Administrador');
  }
  
  next();
};