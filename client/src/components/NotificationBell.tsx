import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../utils/format';
import type { NotificationItem } from '../types';
import type { RootState } from '../redux/store';

const typeIcon: Record<string, string> = {
  visit: '📅',
  message: '💬',
  property: '🏘️',
  system: '🔔',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const socket = useSelector((s: RootState) => s.ui.socket);
  const { isAuthenticated, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refresh = (): void => {
    notificationService
      .get()
      .then(({ data }) => setNotifications(data.data))
      .catch(() => {});
    notificationService
      .getUnreadCount()
      .then(({ data }) => setUnread(data.count))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (): void => {
      setUnread((prev) => prev + 1);
      notificationService.get().then(({ data }) => setNotifications(data.data)).catch(() => {});
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [socket]);

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async (): Promise<void> => {
    try {
      await notificationService.markAllRead();
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      catchError(error, t('notify.notificationsFailed'));
    }
  };

  const handleClick = async (n: NotificationItem): Promise<void> => {
    setOpen(false);
    if (!n.read) {
      try {
        await notificationService.markRead(n._id);
        setUnread((prev) => Math.max(prev - 1, 0));
      } catch {
        // non-blocking
      }
    }
    if (n.link) navigate(n.link);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label={t('messages.notificationsAria')}
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="font-semibold">{t('messages.notifications')}</p>
            {unread > 0 && (
              <button onClick={() => void markAllRead()} className="text-xs text-primary-600 hover:underline">
                {t('messages.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">{t('messages.noNotifications')}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => void handleClick(n)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${n.read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{typeIcon[n.type || ''] || '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-100">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(n.createdAt || '')}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}