import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { storeUserData, clearAuthData, getCurrentUser } from '../utils/auth';

interface AuthContextType {
  /** Current authenticated user or null */
  user: User | null;
  /** True if the user is authenticated */
  isAuthenticated: boolean;
  /** True if the initial auth check is running */
  isLoading: boolean;
  /**
   * Logs the user in with the provided data and token.
   * @param user User data object
   * @param token JWT token string
   * @param rememberMe Whether to persist the session (default: true)
   */
  login: (user: User, token: string, rememberMe?: boolean) => void;
  /** Clears the session and logs the user out */
  logout: () => void;
  /** Re-fetches the current user profile from the API */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Always try to fetch current user session from cookie
        const result = await getCurrentUser();

        if (result.success && result.user) {
          setUser(result.user);
          storeUserData(result.user);
        } else {
          // If session is invalid, clear any stale local data
          setUser(null);
          clearAuthData();
        }
      } catch {
        // Network error possibly, keep existing user if any (optimistic) or clear? 
        // Safer to clear or do nothing.
        // For now, let's assume no user if verify fails
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User, _token: string, rememberMe: boolean = true) => {
    setUser(userData);
    // storeAuthToken(token, rememberMe); // No-op
    storeUserData(userData, rememberMe);
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  const refreshUser = async () => {
    const result = await getCurrentUser();
    if (result.success && result.user) {
      setUser(result.user);
      storeUserData(result.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
