import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const streak = user?.currentStreak || 0;

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-12 h-full">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span
            className="material-symbols-outlined icon-fill"
            style={{ color: 'var(--th-primary-container)', fontSize: '26px' }}
          >
            hiking
          </span>
          <span
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: '21px',
              color: 'var(--th-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Trailhead
          </span>
        </Link>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">

          {/* Streak Badge */}
          {isAuthenticated && (
            <div className="streak-badge">
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: '17px' }}>
                local_fire_department
              </span>
              <span>{streak}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span
                className="hidden md:inline"
                style={{
                  fontSize: '13px',
                  color: 'var(--th-muted)',
                  fontFamily: 'Hanken Grotesk, sans-serif',
                }}
              >
                {user?.email}
              </span>
              <button onClick={handleLogout} className="btn-ghost py-2 px-3 text-sm">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary py-2 px-4 text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
