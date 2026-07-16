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


export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new ValidationError('Email y contraseña son requeridos');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single<DbUser>();

  if (error || !user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

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


export const registerUser = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const { email, password, name, role } = userData;

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

  const hashedPassword = await bcrypt.hash(password, 10);

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


export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {

    throw error;
  }
};


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

export const updateUser = async (userId: string, updates: Partial<RegisterRequest>) => {
  const { email, name, role } = updates;

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
