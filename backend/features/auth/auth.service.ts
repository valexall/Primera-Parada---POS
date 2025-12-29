import { supabase } from '../../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, DbUser, JWTPayload } from './auth.types';
import { 
  ValidationError, 
  UnauthorizedError, 
  ConflictError 
} from '../../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_cambiar_en_prod';

/**
 * AuthService - Lógica de autenticación y autorización
 */

/**
 * Autentica un usuario y genera un JWT
 */
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { email, password } = credentials;

  // ✅ Validaciones con errores específicos
  if (!email || !password) {
    throw new ValidationError('Email y contraseña son requeridos');
  }

  // Buscar usuario
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single<DbUser>();

  if (error || !user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar contraseña
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Generar Token JWT
  const payload: JWTPayload = {
    id: user.id,
    role: user.role,
    name: user.name
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  return {
    token,
    user: {
      name: user.name,
      role: user.role as 'admin' | 'cajero' | 'cocina',
      email: user.email
    }
  };
};

/**
 * Registra un nuevo usuario
 * NOTA: En producción, esta función debe estar protegida (solo admin)
 */
export const registerUser = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const { email, password, name, role } = userData;

  // ✅ Validaciones con errores específicos
  if (!email || !password || !name || !role) {
    throw new ValidationError('Todos los campos son requeridos');
  }

  if (password.length < 6) {
    throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
  }

  const validRoles = ['admin', 'cajero', 'cocina'];
  if (!validRoles.includes(role)) {
    throw new ValidationError('Rol inválido. Roles permitidos: admin, cajero, cocina');
  }

  // ✅ OPTIMIZADO: Hash con 10 rounds (balance seguridad/performance)
  // 10 rounds = ~100ms, 12 rounds = ~400ms, 14 rounds = ~1600ms
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password: hashedPassword,
      name,
      role
    }])
    .select()
    .single<DbUser>();

  if (error) {
    // ✅ Manejo específico de errores de base de datos
    if (error.code === '23505') {
      throw new ConflictError('El email ya está registrado');
    }
    throw new Error(`Error creando usuario: ${error.message}`);
  }

  return {
    message: 'Usuario creado exitosamente',
    userId: data.id
  };
};

/**
 * Verifica un token JWT
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Los errores de JWT serán manejados por el errorHandler global
    throw error;
  }
};
