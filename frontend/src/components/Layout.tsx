import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Pill,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  UtensilsCrossed,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/log', icon: PlusCircle, label: 'Log Entry' },
  { to: '/medications', icon: Pill, label: 'Medications' },
  { to: '/food', icon: UtensilsCrossed, label: 'Food' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-primary-900 text-white z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" />
            <path
              d="M18 8v20M10 14c4 4 12 4 16 0M10 22c4-4 12-4 16 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl">Healthread</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop fixed, Mobile slide-in */}
      <aside
        className={clsx(
          'bg-primary-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out',
          // Desktop: fixed sidebar
          'lg:w-64 lg:fixed lg:h-screen lg:translate-x-0',
          // Mobile: slide-in drawer
          'fixed top-0 left-0 h-full w-72',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" />
              <path
                d="M18 8v20M10 14c4 4 12 4 16 0M10 22c4-4 12-4 16 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-2xl">Healthread</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">Overview</p>
            {navItems.slice(0, 2).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg mb-1 transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">Tracking</p>
            {navItems.slice(2, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg mb-1 transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">Share</p>
            {navItems.slice(4, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg mb-1 transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/40 px-3 mb-2">Account</p>
            {navItems.slice(5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg mb-1 transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center font-semibold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Quick Access) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
