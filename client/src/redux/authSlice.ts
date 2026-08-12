import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
}

const getInitialUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('estatehub_user') || 'null');
  } catch {
    return null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getInitialUser(),
    token: localStorage.getItem('estatehub_token') || null,
  } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token?: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token || state.token;
      if (token) localStorage.setItem('estatehub_token', token);
      localStorage.setItem('estatehub_user', JSON.stringify(user));
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...state.user, ...action.payload } as User;
      localStorage.setItem('estatehub_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('estatehub_token');
      localStorage.removeItem('estatehub_user');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.token);

export default authSlice.reducer;