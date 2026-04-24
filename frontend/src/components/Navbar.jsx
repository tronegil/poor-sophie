import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, adminView } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-ocean-800 text-white shadow-md">
      <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-14">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
          <span>⛵</span>
          <span className="hidden sm:inline">Poor Sophie</span>
        </Link>

        <div className="flex items-center gap-4">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-8 w-8 rounded-full ring-2 ring-ocean-600"
            />
          )}
          {user?.is_admin && adminView && (
            <Link
              to="/admin"
              className="text-sm text-ocean-200 hover:text-white transition-colors"
            >
              🛠️ Admin
            </Link>
          )}
          <Link
            to="/settings"
            className="text-sm text-ocean-200 hover:text-white transition-colors"
          >
            {t('nav.settings')}
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-ocean-200 hover:text-white transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
