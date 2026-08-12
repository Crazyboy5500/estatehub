import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon, HeartIcon, BuildingOfficeIcon, CalendarIcon,
  ChatBubbleLeftRightIcon, UserCircleIcon, PlusCircleIcon,
  UsersIcon, ChartBarIcon, ArrowLeftOnRectangleIcon, ShieldCheckIcon,
  SunIcon, MoonIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/format';
import { toggleDarkMode } from '../redux/uiSlice';
import NotificationBell from '../components/NotificationBell';
import type { RootState } from '../redux/store';

const iconClass = 'h-5 w-5 shrink-0';

interface DashLink {
  to: string;
  label: string;
  icon: typeof HomeIcon;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-primary-600 text-white'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;

export default function DashboardLayout() {
  const user = useSelector((s: RootState) => s.auth.user);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const { logout, notify } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const links: DashLink[] = [];
  if (user?.role === 'buyer') {
    links.push(
      { to: '/dashboard/buyer', label: t('dash.myDashboard'), icon: HomeIcon },
      { to: '/dashboard/buyer', label: t('dash.savedBookings'), icon: HeartIcon },
      { to: '/dashboard/messages', label: t('dash.messages'), icon: ChatBubbleLeftRightIcon },
      { to: '/dashboard/profile', label: t('dash.profile'), icon: UserCircleIcon }
    );
  }
  if (user?.role === 'owner') {
    links.push(
      { to: '/dashboard/owner', label: t('dash.ownerDashboard'), icon: ChartBarIcon },
      { to: '/dashboard/add-property', label: t('dash.addProperty'), icon: PlusCircleIcon },
      { to: '/dashboard/owner', label: t('dash.myListingsLink'), icon: BuildingOfficeIcon },
      { to: '/dashboard/visits', label: t('dash.visitRequests'), icon: CalendarIcon },
      { to: '/dashboard/messages', label: t('dash.messages'), icon: ChatBubbleLeftRightIcon },
      { to: '/dashboard/profile', label: t('dash.profile'), icon: UserCircleIcon }
    );
  }
  if (user?.role === 'admin') {
    links.push(
      { to: '/admin', label: t('dash.overview'), icon: ChartBarIcon },
      { to: '/admin/users', label: t('dash.users'), icon: UsersIcon },
      { to: '/admin/properties', label: t('dash.verificationQueue'), icon: ShieldCheckIcon },
      { to: '/admin/messages', label: t('dash.messages'), icon: ChatBubbleLeftRightIcon },
      { to: '/admin/profile', label: t('dash.profile'), icon: UserCircleIcon }
    );
  }

  const handleLogout = (): void => {
    logout();
    notify(t('dash.loggedOut'));
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 max-lg:hidden">
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <span className="text-2xl">🏠</span>
          <span className="text-lg font-bold text-primary-600">EstateHub</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map((link) => (
            <NavLink key={link.label + link.to} to={link.to} end={link.to === '/dashboard/buyer' || link.to === '/dashboard/owner' || link.to === '/admin'} className={linkClass}>
              <link.icon className={iconClass} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-3">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name || 'user'} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {getInitials(user?.name || '')}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
            <ArrowLeftOnRectangleIcon className={iconClass} />
            {t('dash.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <h1 className="text-lg font-bold">{t('dash.dashboard')}</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={t('nav.toggleDark')}
              title={t('nav.toggleDark')}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              {links.slice(0, 4).map((link) => (
                <NavLink key={link.label} to={link.to} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300">
                  <link.icon className="h-5 w-5" />
                </NavLink>
              ))}
              <button onClick={handleLogout} className="rounded-lg p-2 text-red-600">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}