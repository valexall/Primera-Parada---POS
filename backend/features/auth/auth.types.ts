
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moza';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'moza';
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'id'>;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface DbUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at?: string;
}


export interface JWTPayload {
  id: string;
  role: string;
  name: string;
}
