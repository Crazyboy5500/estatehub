import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toggleDarkMode } from '../redux/uiSlice';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/format';
import {
  SunIcon, MoonIcon, Bars3Icon, XMarkIcon, UserCircleIcon,
  ArrowLeftOnRectangleIcon, PlusCircleIcon, ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import type { RootState } from '../redux/store';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
      : 'text-gray-600 hover:text-primary-600 dark:text-gray-300'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAuthenticated = useSelector((s: RootState) => Boolean(s.auth.token));
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const dispatch = useDispatch();
  const { logout, notify } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = (): void => {
    logout();
    notify(t('nav.loggedOut'));
    navigate('/');
  };

  const dashboardLink =
    user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/dashboard/owner' : '/dashboard/buyer';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <nav className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary-600">
          <span className="text-2xl">🏠</span> EstateHub
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>{t('nav.home')}</NavLink>
          <NavLink to="/properties" className={navLinkClass}>{t('nav.browse')}</NavLink>
          <NavLink to="/compare" className={navLinkClass}>{t('nav.compare')}</NavLink>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell />
          <LanguageSwitcher />
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={t('nav.toggleDark')}
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {getInitials(user?.name || '')}
                  </div>
                )}
              </button>
              {userMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <p className="px-3 py-2 text-sm">
                    <span className="block font-semibold">{user?.name}</span>
                    <span className="text-xs capitalize text-gray-500">{user?.role}</span>
                  </p>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <Link to={dashboardLink} onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                    <UserCircleIcon className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link to="/dashboard/messages" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Messages
                  </Link>
                  {user?.role === 'owner' && (
                    <Link to="/dashboard/add-property" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                      <PlusCircleIcon className="h-4 w-4" /> List Property
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary">{t('nav.getStarted')}</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden" aria-label={t('nav.menu')}>
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">{t('nav.home')}</Link>
            <Link to="/properties" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">{t('nav.browse')}</Link>
            <Link to="/compare" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">{t('nav.compare')}</Link>
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to={dashboardLink} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">{t('nav.dashboard')}</Link>
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline mt-2">{t('nav.login')}</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary mt-2">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}