import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { setCredentials, logout as logoutAction, updateUser } from '../redux/authSlice';
import { showToast } from '../redux/uiSlice';
import { authService } from '../services/authService';
import { handleError } from '../services/api';
import type { RootState, AppDispatch } from '../redux/store';
import type { User, ToastState } from '../types';
import type { RegisterData } from '../services/authService';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => Boolean(s.auth.token));

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await authService.login({ email, password });
    dispatch(setCredentials({ user: data.user, token: data.token }));
    return data.user;
  };

  const googleLogin = async (credential: string): Promise<User> => {
    const { data } = await authService.google(credential);
    dispatch(setCredentials({ user: data.user, token: data.token }));
    return data.user;
  };

  const register = async (formData: RegisterData): Promise<User> => {
    const { data } = await authService.register(formData);
    dispatch(setCredentials({ user: data.user, token: data.token }));
    return data.user;
  };

  const logout = (): void => {
    dispatch(logoutAction());
  };

  const updateProfile = async (payload: Partial<User>): Promise<User> => {
    const { data } = await authService.updateMe(payload);
    dispatch(updateUser(data.user));
    return data.user;
  };

  const toggleFavorite = async (propertyId: string): Promise<string[]> => {
    const { data } = await authService.toggleFavorite(propertyId);
    const ids = data.favorites.map((f: string | { _id: string }) => (typeof f === 'string' ? f : f._id));
    dispatch(updateUser({ favorites: ids }));
    return ids;
  };

  const notify = (message: string, type: ToastState['type'] = 'success'): void => {
    dispatch(showToast({ message, type }));
  };

  const catchError = (error: unknown, fallback?: string): void =>
    notify(handleError(error, fallback), 'error');

  return { user, isAuthenticated, login, googleLogin, register, logout, updateProfile, toggleFavorite, notify, catchError };
};