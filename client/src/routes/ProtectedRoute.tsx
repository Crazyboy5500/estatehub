import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { JSX } from 'react';
import type { RootState } from '../redux/store';
import type { User } from '../types';

export const ProtectedRoute = ({ roles = [] }: { roles?: string[] }): JSX.Element => {
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);

  if (!token) return <Navigate to="/login" replace />;
  if (roles.length && (!user || !roles.includes(user.role))) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <Outlet />;
};

export const RoleRedirect = (): JSX.Element => {
  const user = useSelector((s: RootState) => s.auth.user);
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};