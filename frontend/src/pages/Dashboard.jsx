import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';
import useAuthStore from '../store/authStore';

const statusCls = {
  generating: 'pill-generating',
  active:     'pill-active',
  completed:  'pill-completed',
  abandoned:  'pill-abandoned',
};

export default function Dashboard() {
  const { roadmaps, fetchRoadmaps, loading, error } = useRoadmapStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchRoadmaps();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center animate-fade-in max-w-md">
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)', fontSize: '64px', display: 'block', marginBottom: '20px' }}>
            hiking
          </span>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '32px', color: 'var(--th-on-surface)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Welcome to Trailhead
          </h1>
          <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', color: 'var(--th-on-surface-variant)', marginBottom: '32px' }}>
            Your AI-powered learning companion. Beat procrastination, one milestone at a time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-ghost">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  const streak = user?.currentStreak || 0;

  return (
    <div className="page-bg min-h-screen pt-24 pb-16 px-4 md:px-12" style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* Hero */}
      <section className="mb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.1em', marginBottom: '6px' }}>
              WELCOME BACK
            </p>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--th-on-surface)', letterSpacing: '-0.02em' }}>
              {user?.email?.split('@')[0]}
            </h1>
          </div>

          {/* Streak card */}
          <div
            className="flex items-center gap-4 p-5 rounded-xl"
            style={{
              background: 'var(--th-streak-bg)',
              border: '1px solid var(--th-streak-border)',
              minWidth: '190px',
            }}
          >
            <span className="material-symbols-outlined icon-fill animate-float" style={{ color: 'var(--th-streak-color)', fontSize: '40px' }}>
              local_fire_department
            </span>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '32px', color: 'var(--th-streak-color)', lineHeight: 1 }}>
                {streak}
              </p>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 700, color: 'var(--th-streak-color)', letterSpacing: '0.06em', marginTop: '4px', opacity: 0.8 }}>
                DAY STREAK
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-10">
        <Link to="/new" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-base">
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: '20px' }}>add_circle</span>
          New Learning Trail
        </Link>
      </section>

      {/* Roadmaps */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '20px', color: 'var(--th-on-surface)' }}>
            Your Roadmaps
          </h2>
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-muted)' }}>
            {roadmaps.length} total
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined animate-spin-glow" style={{ color: 'var(--th-primary-container)', fontSize: '24px' }}>refresh</span>
            <span style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-muted)' }}>Loading your roadmaps…</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl mb-6" style={{ background: 'color-mix(in srgb, var(--th-error-container) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--th-error) 25%, transparent)' }}>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-on-error-container)' }}>{error}</p>
          </div>
        )}

        {!loading && roadmaps.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-xl"
            style={{ border: '2px dashed var(--th-outline-variant)', background: 'var(--th-surface-container-low)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--th-outline-variant)', fontSize: '48px', marginBottom: '16px' }}>map</span>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '18px', color: 'var(--th-on-surface-variant)', marginBottom: '8px' }}>
              No roadmaps yet
            </p>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-muted)', marginBottom: '24px' }}>
              Start your first learning trail today.
            </p>
            <Link to="/new" className="btn-primary">
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px' }}>add</span>
              Create Roadmap
            </Link>
          </div>
        )}

        {!loading && roadmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map((roadmap, index) => (
              <RoadmapCard key={roadmap._id} roadmap={roadmap} index={index} navigate={navigate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RoadmapCard({ roadmap, index, navigate }) {
  const { deleteRoadmap, abandonRoadmap } = useRoadmapStore();
  const isGenerating = roadmap.status === 'generating';
  const isAbandoned  = roadmap.status === 'abandoned';
  const isActive     = roadmap.status === 'active';

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${roadmap.goal}"? This cannot be undone.`)) return;
    try { await deleteRoadmap(roadmap._id); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete roadmap'); }
  };

  const handleAbandon = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Abandon "${roadmap.goal}"?`)) return;
    try { await abandonRoadmap(roadmap._id); }
    catch (err) { alert(err.response?.data?.message || 'Failed to abandon roadmap'); }
  };

  return (
    <div
      className="card group cursor-pointer animate-fade-in"
      style={{
        animationDelay: `${index * 0.07}s`,
        padding: '1.5rem',
        border: isActive ? '1px solid color-mix(in srgb, var(--th-primary-container) 30%, transparent)' : '1px solid var(--th-card-border)',
      }}
      onClick={() => {
        if (isGenerating) navigate(`/roadmaps/${roadmap._id}/loading`);
        else if (!isAbandoned) navigate(`/roadmaps/${roadmap._id}`);
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <span className={statusCls[roadmap.status] || 'pill-active'}>{roadmap.status}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isActive && (
            <button onClick={handleAbandon} className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--th-surface-container)', color: 'var(--th-on-surface-variant)' }} title="Abandon">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>pause_circle</span>
            </button>
          )}
          <button onClick={handleDelete} className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'color-mix(in srgb, var(--th-error) 10%, transparent)', color: 'var(--th-error)' }} title="Delete">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
          </button>
        </div>
      </div>

      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: isAbandoned ? 'var(--th-muted)' : 'var(--th-on-surface)', marginBottom: '6px', lineHeight: '22px' }}>
        {roadmap.goal}
      </h3>

      {roadmap.targetTimeframe && (
        <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--th-secondary)' }}>schedule</span>
          {roadmap.targetTimeframe}
        </p>
      )}

      {isGenerating && (
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--th-secondary)', animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-secondary)' }}>Generating…</span>
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-1" style={{ color: 'var(--th-primary-container)' }}>
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600 }}>View Roadmap</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
        </div>
      )}
    </div>
  );
}
