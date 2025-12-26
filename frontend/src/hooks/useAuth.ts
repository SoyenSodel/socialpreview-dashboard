import { useState, useCallback } from 'react';
import type { LoginCredentials, AuthState, AuthError } from '../types/auth.types';
import { validateLoginCredentials } from '../utils/validation';
import { loginUser, storeAuthToken, storeUserData } from '../utils/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const [validationErrors, setValidationErrors] = useState<AuthError[]>([]);

  const login = useCallback(async (credentials: LoginCredentials) => {

    setValidationErrors([]);
    setAuthState((prev) => ({ ...prev, error: null }));

    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return { success: false };
    }

    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {

      const response = await loginUser(credentials);

      if (response.success && response.user) {

        storeAuthToken();
        storeUserData(response.user);

        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true, user: response.user };
      } else {

        const error: AuthError = {
          field: 'general',
          message: response.error || 'Login failed',
        };

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));

        setValidationErrors([error]);
        return { success: false };
      }
    } catch (error) {
      console.error('Login error:', error);

      const authError: AuthError = {
        field: 'general',
        message: 'An unexpected error occurred. Please try again.',
      };

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));

      setValidationErrors([authError]);
      return { success: false };
    }
  }, []);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    validationErrors,
    login,
    clearErrors,
  };
};
