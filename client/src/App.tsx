import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from './hooks/useSocket';
import { clearToast, selectToast, selectDarkMode } from './redux/uiSlice';
import { ProtectedRoute, RoleRedirect } from './routes/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/ui';
import type { RootState } from './redux/store';
import type { JSX } from 'react';

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ScrollToTop from './components/ScrollToTop';
import Toast from './components/Toast';

const HomePage = lazy(() => import('./pages/HomePage'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailsPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const BuyerDashboard = lazy(() => import('./pages/dashboard/BuyerDashboard'));
const OwnerDashboard = lazy(() => import('./pages/dashboard/OwnerDashboard'));
const AddPropertyPage = lazy(() => import('./pages/dashboard/AddPropertyPage'));
const OwnerVisitsPage = lazy(() => import('./pages/dashboard/OwnerVisitsPage'));
const MessagesPage = lazy(() => import('./pages/dashboard/MessagesPage'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/dashboard/AdminUsersPage'));
const AdminPropertiesPage = lazy(() => import('./pages/dashboard/AdminPropertiesPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function App(): JSX.Element {
  const token = useSelector((s: RootState) => s.auth.token);
  const toast = useSelector(selectToast);
  const darkMode = useSelector(selectDarkMode);
  const dispatch = useDispatch();

  useSocket(token);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Lazy>
        <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<RoleRedirect />} />
            <Route path="buyer" element={<BuyerDashboard />} />
            <Route path="owner" element={<OwnerDashboard />} />
            <Route path="add-property" element={<AddPropertyPage />} />
            <Route path="edit-property/:id" element={<AddPropertyPage />} />
            <Route path="visits" element={<OwnerVisitsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="properties" element={<AdminPropertiesPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      </Lazy>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;
