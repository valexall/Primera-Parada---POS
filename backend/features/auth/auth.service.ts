import { supabase } from '../../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, DbUser, JWTPayload } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_cambiar_en_prod';

/**
 * AuthService - Lógica de autenticación y autorización
 */

/**
 * Autentica un usuario y genera un JWT
 */
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { email, password } = credentials;

  // Validaciones básicas
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos');
  }

  // Buscar usuario
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single<DbUser>();

  if (error || !user) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar contraseña
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Credenciales inválidas');
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

  // Validaciones
  if (!email || !password || !name || !role) {
    throw new Error('Todos los campos son requeridos');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const validRoles = ['admin', 'cajero', 'cocina'];
  if (!validRoles.includes(role)) {
    throw new Error('Rol inválido');
  }

  // Hash del password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

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
    // Manejo de error de email duplicado
    if (error.code === '23505') {
      throw new Error('El email ya está registrado');
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
    throw new Error('Token inválido o expirado');
  }
};
