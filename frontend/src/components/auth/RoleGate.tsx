import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/context/AuthContext';

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children when the authenticated user's role is in allowedRoles.
 * Use for conditional UI visibility — not for route-level access control.
 */
export const RoleGate = ({ allowedRoles, children, fallback = null }: RoleGateProps) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
