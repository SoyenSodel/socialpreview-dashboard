import type { LoginCredentials, AuthResponse, User } from '../types';
import config from '../config/config';

const API_BASE_URL = `${config.apiUrl}/api`;

/**
 * Authenticates a user with the backend API.
 * 
 * @param credentials Login details (email, password, TOTP code)
 * @returns Auth response including token and user profile or 2FA requirement status
 */
export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const requestBody: { email: string; password: string; totp_code?: string } = {
      email: credentials.email,
      password: credentials.password,
    };

    if (credentials.totp_code && credentials.totp_code.trim() !== '') {
      requestBody.totp_code = credentials.totp_code;
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.requires_2fa) {
      return {
        success: false,
        requires_2fa: true,
        error: data.error,
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

/**
 * Fetches the current user's profile using the session cookie.
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to fetch user',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

  } catch {
    // Ignore logout errors
  }

  localStorage.clear();
  sessionStorage.clear();
};

// Deprecated/Removed token functions - kept as no-ops if imported elsewhere temporarily
export const storeAuthToken = (): void => { };
export const getAuthToken = (): string | null => null;
export const removeAuthToken = (): void => { };

export const storeUserData = (user: User, rememberMe: boolean = true): void => {
  const { ...userWithoutPicture } = user;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile_picture: _, ...rest } = userWithoutPicture;
  const userData = JSON.stringify(rest);

  localStorage.setItem('user_data', userData);

  if (!rememberMe) {
    sessionStorage.setItem('user_data', userData);
  } else {
    sessionStorage.removeItem('user_data');
  }
};

export const getUserData = (): User | null => {
  const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

export const removeUserData = (): void => {
  localStorage.removeItem('user_data');
  sessionStorage.removeItem('user_data');
};

export const clearAuthData = (): void => {
  // removeAuthToken(); // No longer needed
  removeUserData();
  logoutUser();
};
