import type { ForgotPasswordResponse } from '../types/auth.types';
import { isValidEmail } from './validation';

export const validateResetEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
};

export const sendPasswordResetEmail = async (): Promise<ForgotPasswordResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    success: true,
    message: 'Password reset link has been sent to your email',
  };
};
