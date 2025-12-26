import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'team' | 'user';
}


/**
 * A wrapper component that enforces authentication and role-based access control.
 * Restricts access to children components based on user login state and role.
 */
export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
