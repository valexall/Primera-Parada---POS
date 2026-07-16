import { supabase } from '../../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, DbUser, JWTPayload, ChangePasswordRequest, SetSecurityQuestionRequest, ResetPasswordWithQuestionRequest } from './auth.types';
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
  const { email, password, name, role, securityQuestion, securityAnswer } = userData;

  if (!email || !password || !name || !role) {
    throw new ValidationError('Todos los campos obligatorios son requeridos');
  }

  if (password.length < 6) {
    throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
  }

  const validRoles = ['admin', 'moza'];
  if (!validRoles.includes(role)) {
    throw new ValidationError('Rol inválido. Roles permitidos: admin, moza');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  let hashedAnswer = null;
  if (securityAnswer) {
    hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password: hashedPassword,
      name,
      role,
      security_question: securityQuestion || null,
      security_answer: hashedAnswer
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

export const changeOwnPassword = async (userId: string, data: ChangePasswordRequest) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('La contraseña actual y la nueva son requeridas');
  }

  if (newPassword.length < 6) {
    throw new ValidationError('La nueva contraseña debe tener al menos 6 caracteres');
  }

  // Obtener el hash actual del usuario
  const { data: user, error } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .single<{ password: string }>();

  if (error || !user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  // Verificar que la contraseña actual es correcta
  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    throw new UnauthorizedError('La contraseña actual es incorrecta');
  }

  // Evitar que se use la misma contraseña
  const samePassword = await bcrypt.compare(newPassword, user.password);
  if (samePassword) {
    throw new ValidationError('La nueva contraseña no puede ser igual a la actual');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Error actualizando contraseña: ${updateError.message}`);
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

/**
 * Verifica si un email está registrado en el sistema.
 * Usado en el flujo de recuperación de contraseña desde la página de login.
 * Por seguridad, siempre devuelve el mismo mensaje genérico al usuario final.
 */
export const checkEmailForRecovery = async (email: string): Promise<{ exists: boolean }> => {
  if (!email) {
    throw new ValidationError('El correo electrónico es requerido');
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('email', email)
    .maybeSingle();

  return { exists: !!(user && user.is_active) };
};

// ============================================================
// RF01 — PREGUNTA DE SEGURIDAD
// ============================================================

/**
 * Configura o actualiza la pregunta de seguridad del usuario autenticado.
 * La respuesta se guarda hasheada con bcrypt.
 */
export const setSecurityQuestion = async (userId: string, data: SetSecurityQuestionRequest) => {
  const { question, answer } = data;

  if (!question || !answer) {
    throw new ValidationError('La pregunta y la respuesta son requeridas');
  }
  if (answer.trim().length < 2) {
    throw new ValidationError('La respuesta debe tener al menos 2 caracteres');
  }

  const hashedAnswer = await bcrypt.hash(answer.trim().toLowerCase(), 10);

  const { error } = await supabase
    .from('users')
    .update({ security_question: question, security_answer: hashedAnswer })
    .eq('id', userId);

  if (error) {
    throw new Error(`Error configurando pregunta de seguridad: ${error.message}`);
  }

  return { message: 'Pregunta de seguridad configurada exitosamente' };
};

/**
 * Devuelve SOLO la pregunta de seguridad de un usuario dado su email.
 * No expone la respuesta ni datos sensibles.
 */
export const getSecurityQuestion = async (email: string): Promise<{ question: string }> => {
  if (!email) {
    throw new ValidationError('El correo electrónico es requerido');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('security_question, is_active')
    .eq('email', email)
    .maybeSingle<{ security_question: string | null; is_active: boolean }>();

  if (error || !user || !user.is_active) {
    throw new UnauthorizedError('No se encontró una cuenta activa con ese correo');
  }

  if (!user.security_question) {
    throw new ValidationError('Este usuario no tiene configurada una pregunta de seguridad. Contacta al administrador.');
  }

  return { question: user.security_question };
};

/**
 * Verifica la respuesta secreta y, si es correcta, actualiza la contraseña.
 * La comparación se hace con bcrypt para proteger la respuesta almacenada.
 */
export const resetPasswordWithQuestion = async (data: ResetPasswordWithQuestionRequest) => {
  const { email, answer, newPassword } = data;

  if (!email || !answer || !newPassword) {
    throw new ValidationError('Todos los campos son requeridos');
  }
  if (newPassword.length < 6) {
    throw new ValidationError('La nueva contraseña debe tener al menos 6 caracteres');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, security_answer, is_active')
    .eq('email', email)
    .maybeSingle<{ id: string; security_answer: string | null; is_active: boolean }>();

  if (error || !user || !user.is_active) {
    throw new UnauthorizedError('No se encontró una cuenta activa con ese correo');
  }

  if (!user.security_answer) {
    throw new ValidationError('Este usuario no tiene configurada una pregunta de seguridad');
  }

  // Comparar respuesta (normalizar a minúsculas y sin espacios extra)
  const isAnswerValid = await bcrypt.compare(answer.trim().toLowerCase(), user.security_answer);
  if (!isAnswerValid) {
    throw new UnauthorizedError('La respuesta a la pregunta de seguridad es incorrecta');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(`Error restableciendo contraseña: ${updateError.message}`);
  }

  return { message: 'Contraseña restablecida exitosamente' };
};
