import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from './brand/Wordmark';

const linkClass = ({ isActive }) =>
  `text-sm py-1 border-b-2 transition-colors ${isActive ? 'text-deep-on border-magenta' : 'text-deep-on/75 border-transparent hover:text-deep-on'}`;

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, adminView } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-deep text-deep-on">
      <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-14">
        <Link to="/dashboard" className="text-xl text-deep-on">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-4">
          {user?.is_admin && adminView && (
            <NavLink to="/admin" className={linkClass}>
              <span className="inline-flex items-center gap-1"><Wrench size={14} strokeWidth={1.75} />Admin</span>
            </NavLink>
          )}
          <NavLink to="/settings" className={linkClass}>
            {t('nav.settings')}
          </NavLink>
          <button
            onClick={handleLogout}
            className="text-sm text-deep-on/75 hover:text-deep-on transition-colors"
          >
            {t('nav.logout')}
          </button>
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-8 w-8 rounded-full ring-2 ring-ocean-500"
            />
          )}
        </div>
      </div>
    </nav>
  );
}
