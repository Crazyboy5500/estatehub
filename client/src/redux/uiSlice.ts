import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Socket } from 'socket.io-client';
import type { RootState } from './store';
import type { ToastState } from '../types';

interface UiState {
  darkMode: boolean;
  toast: ToastState | null;
  socket: Socket | null;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('estatehub_dark') === 'true',
    toast: null,
    socket: null,
  } as UiState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('estatehub_dark', String(state.darkMode));
    },
    showToast: (state, action: PayloadAction<ToastState>) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.socket = action.payload as any;
    },
  },
});

export const { toggleDarkMode, showToast, clearToast, setSocket } = uiSlice.actions;
export const selectDarkMode = (state: RootState) => state.ui.darkMode;
export const selectToast = (state: RootState) => state.ui.toast;
export const selectSocket = (state: RootState) => state.ui.socket;

export default uiSlice.reducer;