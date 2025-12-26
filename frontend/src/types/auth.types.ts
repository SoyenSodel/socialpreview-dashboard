


/**
 * Credentials required for user login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  totp_code?: string;
}

/**
 * Core user entity.
 * Matches the backend User struct.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar?: string;
  profile_picture?: string;
  role: UserRole;
  totp_enabled?: boolean;
}

/**
 * Access levels for the application.
 */
export const UserRole = {
  MANAGEMENT: 'management',
  TEAM: 'team',
  USER: 'user'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * API response structure for authentication requests.
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requires_2fa?: boolean;
  temp_token?: string;
}

/**
 * Field-specific validation errors.
 */
export interface AuthError {
  field?: 'email' | 'password' | 'general' | 'totp_code';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: AuthError[];
}

/**
 * State shape for the AuthContext.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}
