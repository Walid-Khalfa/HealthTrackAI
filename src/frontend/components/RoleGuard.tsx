
import React from 'react';
import { AppRole } from '@shared/types';
import { useAuth } from '@frontend/context/AuthContext';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback = null }) => {
  const { role, loading } = useAuth();

  if (loading) return null; // Or render nothing/spinner

  // Super Admin bypasses checks (optional, but good for dev)
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
