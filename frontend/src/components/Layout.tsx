import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  MessageCircleQuestion,
  GraduationCap,
  Library,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Catalog', icon: Library },
  { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/faq', label: 'FAQ Assistant', icon: MessageCircleQuestion },
  { to: '/research', label: 'Research', icon: GraduationCap },
  { to: '/loans', label: 'My Loans', icon: BookOpen },
];

const ADMIN_ITEMS = [
  { to: '/admin/books/new', label: 'Add Book', icon: Search },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <BookOpen className="w-6 h-6" />
            <span className="hidden sm:inline">Library Assistant</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            {isAdmin &&
              ADMIN_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-500">
              {user?.name}{' '}
              {isAdmin && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-indigo-100 text-indigo-700 font-medium">
                  Admin
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-600"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={linkClass}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            {isAdmin &&
              ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={linkClass}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
          </nav>
        )}
      </header>

      {/* Main content area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        AI-Powered Library &amp; Research Assistant · HCL Hackathon Team Aivaro
      </footer>
    </div>
  );
}
