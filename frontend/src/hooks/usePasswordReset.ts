import { useState, useCallback } from 'react';
// import type { ForgotPasswordRequest } from '../types/auth.types';
import { validateResetEmail, sendPasswordResetEmail } from '../utils/passwordReset';

export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestReset = useCallback(async (email: string) => {

    setError(null);
    setSuccessMessage(null);

    const validation = validateResetEmail(email);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email');
      return { success: false };
    }

    setIsLoading(true);

    try {
      // const data: ForgotPasswordRequest = { email };
      const response = await sendPasswordResetEmail();

      if (response.success) {
        setSuccessMessage(response.message || 'Password reset link sent successfully');
        setIsLoading(false);
        return { success: true };
      } else {
        setError(response.error || 'Failed to send reset link');
        setIsLoading(false);
        return { success: false };
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    isLoading,
    error,
    successMessage,
    requestReset,
    clearMessages,
  };
};
