/**
 * Types para el módulo de Autenticación
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cajero' | 'cocina';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'cajero' | 'cocina';
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'id'>;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

/**
 * Tipo interno de usuario en la BD
 */
export interface DbUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at?: string;
}

/**
 * Payload del JWT
 */
export interface JWTPayload {
  id: string;
  role: string;
  name: string;
}
