import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import axiosClient from '../api/axiosClient';
import { validatePassword } from '../utils/passwordValidator';
import { toast } from '../store/toastStore';

export default function Navbar() {
  const { user, isAuthenticated, logout, deleteAccount } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAcc, setDeletingAcc] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleLogout = () => {
    logout();
    setShowSettings(false);
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      setPwError(pwCheck.message!);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setPwError('New password must be different from current password');
      return;
    }

    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await axiosClient.patch('/auth/update-password', {
        currentPassword,
        newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to update password. Verify current password.'
      );
    } finally {
      setPwLoading(false);
    }
  };

  const streak = user?.currentStreak || 0;

  return (
    <>
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-12 h-full">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined icon-fill"
              style={{ color: 'var(--th-primary-container)', fontSize: '26px' }}
            >
              hub
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
              GoalWeave
            </span>
          </Link>

          {/* Right-side controls */}
          <div className="flex items-center gap-3">

            {/* Streak Badge */}
            {/* Quick Command Palette trigger */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                className="btn-ghost py-1 px-2.5 text-xs hidden sm:flex items-center gap-1.5 cursor-pointer"
                title="Command Palette (Ctrl + K)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>search</span>
                <span className="opacity-80">Search</span>
                <kbd className="px-1 py-0.2 rounded text-[10px] font-mono opacity-50 bg-black/10 dark:bg-white/10">⌘K</kbd>
              </button>
            )}

            {/* Streak Badge */}
            {isAuthenticated && (
              <div className="streak-badge" title={`${streak} Day Streak`}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '17px' }}>
                  local_fire_department
                </span>
                <span>{streak}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="theme-toggle cursor-pointer"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: 'var(--th-surface-container)',
                    border: '1px solid var(--th-outline-variant)',
                  }}
                  title="Account Settings"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--th-primary-container)' }}>
                    account_circle
                  </span>
                  <span
                    className="hidden md:inline max-w-[140px] truncate text-xs font-semibold"
                    style={{
                      color: 'var(--th-on-surface)',
                      fontFamily: 'Hanken Grotesk, sans-serif',
                    }}
                  >
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </button>
                <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-xs cursor-pointer">
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

      {/* Account Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-md p-6 rounded-2xl shadow-2xl relative"
            style={{
              background: 'var(--th-surface-container)',
              border: '1px solid var(--th-outline-variant)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowSettings(false);
                setPwError('');
                setPwSuccess('');
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined" style={{ color: 'var(--th-primary-container)', fontSize: '28px' }}>
                manage_accounts
              </span>
              <div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--th-on-surface)' }}>
                  Account Settings
                </h3>
                <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-muted)' }}>
                  Manage profile and security credentials
                </p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div
              className="p-3.5 rounded-xl mb-5 space-y-1.5"
              style={{
                background: 'var(--th-surface-container-high)',
                border: '1px solid var(--th-outline-variant)',
              }}
            >
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--th-muted)' }}>Email:</span>
                <span className="font-semibold" style={{ color: 'var(--th-on-surface)' }}>{user?.email}</span>
              </div>
              {user?.name && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--th-muted)' }}>Name:</span>
                  <span className="font-semibold" style={{ color: 'var(--th-on-surface)' }}>{user.name}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--th-muted)' }}>Day Streak:</span>
                <span className="font-semibold" style={{ color: 'var(--th-streak-color)' }}>
                  {user?.currentStreak || 0} days (Record: {user?.longestStreak || 0})
                </span>
              </div>
            </div>

            {/* Change Password Form */}
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--th-primary-container)', fontFamily: 'Hanken Grotesk' }}
            >
              Change Password
            </h4>

            {pwSuccess && (
              <div className="p-2.5 rounded-lg mb-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs">
                {pwSuccess}
              </div>
            )}

            {pwError && (
              <div className="p-2.5 rounded-lg mb-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--th-on-surface)' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-xs py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--th-on-surface)' }}>
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-xs py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--th-on-surface)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-xs py-2"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="btn-ghost py-1.5 px-3 text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="btn-primary py-1.5 px-4 text-xs cursor-pointer"
                >
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-6 pt-4 border-t border-[var(--th-outline-variant)]">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete_forever</span>
                  Delete My Account & All Data
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs animate-fade-in">
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    Are you sure? All your roadmaps, progress, and study notes will be permanently erased.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deletingAcc}
                      onClick={async () => {
                        setDeletingAcc(true);
                        try {
                          await deleteAccount();
                          setShowSettings(false);
                          toast.success('Your account has been deleted.');
                          navigate('/login');
                        } catch (err) {
                          toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete account');
                        } finally {
                          setDeletingAcc(false);
                        }
                      }}
                      className="px-3 py-1 rounded bg-red-600 text-white font-semibold text-xs cursor-pointer"
                    >
                      {deletingAcc ? 'Deleting...' : 'Yes, Delete Permanently'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
