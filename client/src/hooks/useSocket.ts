import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { setSocket } from '../redux/uiSlice';

export const useSocket = (token: string | null): void => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
    });
    dispatch(setSocket(socket));
    return () => {
      socket.disconnect();
      dispatch(setSocket(null));
    };
  }, [token, dispatch]);
};

export const useDarkMode = (): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    const isDark = localStorage.getItem('estatehub_dark') === 'true';
    document.documentElement.classList.toggle('dark', isDark);
  }, [dispatch]);
};