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
      role: user.role as 'admin' | 'moza',
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

  const validRoles = ['admin', 'moza'];
  if (!validRoles.includes(role)) {
    throw new ValidationError('Rol inválido. Roles permitidos: admin, moza');
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

/**
 * Obtiene la lista de todos los usuarios
 * NOTA: Solo para admin
 */
export const getAllUsers = async () => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo usuarios: ${error.message}`);
  }

  return users;
};

/**
 * Obtiene un usuario por ID
 * NOTA: Solo para admin
 */
export const getUserById = async (userId: string) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Error obteniendo usuario: ${error.message}`);
  }

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
};

/**
 * Actualiza un usuario existente
 * NOTA: Solo para admin
 */
export const updateUser = async (userId: string, updates: Partial<RegisterRequest>) => {
  const { email, name, role } = updates;

  // Validar rol si se está actualizando
  if (role) {
    const validRoles = ['admin', 'moza'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Rol inválido. Roles permitidos: admin, moza');
    }
  }

  const updateData: any = {};
  if (email) updateData.email = email;
  if (name) updateData.name = name;
  if (role) updateData.role = role;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ConflictError('El email ya está registrado');
    }
    throw new Error(`Error actualizando usuario: ${error.message}`);
  }

  return {
    message: 'Usuario actualizado exitosamente',
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role
    }
  };
};

/**
 * Actualiza la contraseña de un usuario
 * NOTA: Solo para admin
 */
export const updateUserPassword = async (userId: string, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) {
    throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) {
    throw new Error(`Error actualizando contraseña: ${error.message}`);
  }

  return { message: 'Contraseña actualizada exitosamente' };
};

/**
 * Activa o desactiva un usuario
 * NOTA: Solo para admin
 */
export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error cambiando estado del usuario: ${error.message}`);
  }

  return {
    message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
    user: {
      id: data.id,
      is_active: data.is_active
    }
  };
};

/**
 * Elimina un usuario
 * NOTA: Solo para admin
 */
export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Error eliminando usuario: ${error.message}`);
  }

  return { message: 'Usuario eliminado exitosamente' };
};
