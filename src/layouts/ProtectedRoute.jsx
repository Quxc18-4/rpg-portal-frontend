import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export default function ProtectedRoute({ minRole = 'USER', children }) {
  const { isAuthenticated, checkRole } = useAuth();
  const { lang } = useLanguage();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!checkRole(minRole)) {
    return (
      <div className="border border-accent-crimson bg-surface p-6">
        <div className="font-mono text-xs font-semibold uppercase text-accent-crimson">
          [403 // ACCESS_DENIED]
        </div>
        <p className="mt-2 text-sm text-ink-primary">
          {lang === 'vi'
            ? `Khu vực này yêu cầu quyền tối thiểu [${minRole}].`
            : `This area requires at least [${minRole}] role.`}
        </p>
      </div>
    );
  }

  return children;
}