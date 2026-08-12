import { useSelector } from 'react-redux';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import type { RootState } from '../redux/store';

export default function Toast() {
  const toast = useSelector((s: RootState) => s.ui.toast);
  if (!toast) return null;

  const styles = {
    success: { icon: CheckCircleIcon, cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' },
    error: { icon: XCircleIcon, cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800' },
    info: { icon: InformationCircleIcon, cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800' },
  };
  const { icon: Icon, cls } = styles[toast.type] || styles.info;

  return (
    <div className={`fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 shadow-lg animate-slide-up ${cls}`}>
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}