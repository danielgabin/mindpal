/**
 * User and authentication related TypeScript types.
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'psychologist' | 'admin';
  is_active: boolean;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}
