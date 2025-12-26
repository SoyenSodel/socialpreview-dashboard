import type { AuthError, ValidationResult, LoginCredentials } from '../types/auth.types';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateLoginCredentials = (
  credentials: LoginCredentials
): ValidationResult => {
  const errors: AuthError[] = [];

  if (!credentials.email.trim()) {
    errors.push({
      field: 'email',
      message: 'Email is required',
    });
  } else if (!isValidEmail(credentials.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (!credentials.password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else if (!isValidPassword(credentials.password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getErrorMessage = (
  errors: AuthError[] | Record<string, string>,
  field?: 'email' | 'password' | 'general' | 'totp_code'
): string | undefined => {

  if (errors && !Array.isArray(errors)) {
    return field ? errors[field] : errors['general'];
  }

  if (field) {
    const fieldError = (errors as AuthError[]).find((error) => error.field === field);
    return fieldError?.message;
  }

  const generalError = (errors as AuthError[]).find((error) => !error.field || error.field === 'general');
  return generalError?.message;
};

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  if (!isValidPassword(password)) {
    return 'Password must be at least 8 characters';
  }
  return undefined;
};
