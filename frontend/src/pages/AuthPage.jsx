import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSkillLevel, setRegSkillLevel] = useState('beginner');
  const [regHoursPerDay, setRegHoursPerDay] = useState(1);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(regEmail, regPassword, regSkillLevel, Number(regHoursPerDay));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-bg min-h-screen flex items-center justify-center px-4 pt-16"
    >
      <div className="w-full max-w-md animate-fade-in py-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span
              className="material-symbols-outlined icon-fill"
              style={{ color: 'var(--th-primary-container)', fontSize: '32px' }}
            >
              hiking
            </span>
            <span
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: '28px',
                color: 'var(--th-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Trailhead
            </span>
          </Link>
          <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', color: 'var(--th-on-surface-variant)' }}>
            Welcome back. Let's get moving.
          </p>
        </div>

        {/* Card */}
        <div className="card-flat" style={{ padding: '2rem' }}>

          {/* Tabs */}
          <div
            className="flex rounded-lg p-1 mb-7"
            style={{
              background: 'var(--th-surface-container)',
              border: '1px solid var(--th-outline-variant)',
            }}
          >
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-2 rounded-md text-sm capitalize transition-all duration-200"
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  fontWeight: 600,
                  background: tab === t ? 'var(--th-primary-container)' : 'transparent',
                  color: tab === t ? 'var(--th-on-primary)' : 'var(--th-on-surface-variant)',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-5"
              style={{
                background: 'color-mix(in srgb, var(--th-error-container) 50%, transparent)',
                border: '1px solid color-mix(in srgb, var(--th-error) 30%, transparent)',
              }}
            >
              <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-error)', fontSize: '18px', flexShrink: 0 }}>
                error
              </span>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-error-container)' }}>{error}</p>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                  Email Address
                </label>
                <input type="email" className="input-field" placeholder="hiker@example.com"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                  Password
                </label>
                <input type="password" className="input-field" placeholder="••••••••"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin-glow" style={{ fontSize: '18px' }}>refresh</span> Signing in...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span> Sign In</>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                  Email Address
                </label>
                <input type="email" className="input-field" placeholder="hiker@example.com"
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                  Password
                </label>
                <input type="password" className="input-field" placeholder="••••••••"
                  value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                    Skill Level
                  </label>
                  <select className="input-field" value={regSkillLevel} onChange={(e) => setRegSkillLevel(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-on-surface)' }}>
                    Hours / Day
                  </label>
                  <input type="number" className="input-field" min="0.5" max="24" step="0.5"
                    value={regHoursPerDay} onChange={(e) => setRegHoursPerDay(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin-glow" style={{ fontSize: '18px' }}>refresh</span> Creating account...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Create Account</>
                )}
              </button>
            </form>
          )}

          {/* Footer link */}
          <p className="mt-6 text-center" style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-on-surface-variant)' }}>
            {tab === 'login' ? (
              <>New to Trailhead?{' '}
                <button onClick={() => setTab('register')} style={{ color: 'var(--th-primary-container)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setTab('login')} style={{ color: 'var(--th-primary-container)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
