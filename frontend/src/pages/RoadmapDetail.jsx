import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';
import useAuthStore from '../store/authStore';
import PhaseAccordion from '../components/PhaseAccordion';
import NextTaskCard from '../components/NextTaskCard';

export default function RoadmapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentRoadmap, phases, progress, nextTask,
    fetchRoadmapDetail, fetchNextTask, completeMilestone,
    abandonRoadmap, deleteRoadmap, loading, error,
  } = useRoadmapStore();
  const { updateStreak } = useAuthStore();
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchRoadmapDetail(id);
    fetchNextTask(id);
  }, [id]);

  const handleCompleteNextTask = async (milestoneId) => {
    try {
      const { streak } = await completeMilestone(milestoneId, true);
      if (streak) updateStreak(streak);
      fetchNextTask(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete milestone');
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Abandon this roadmap?')) return;
    setActionLoading('abandon');
    try { await abandonRoadmap(id); }
    catch (err) { alert(err.response?.data?.message || 'Failed to abandon roadmap'); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this roadmap? This cannot be undone.')) return;
    setActionLoading('delete');
    try { await deleteRoadmap(id); navigate('/'); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete roadmap'); setActionLoading(''); }
  };

  if (loading && !currentRoadmap) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center pt-20">
        <span className="material-symbols-outlined animate-spin-glow" style={{ color: 'var(--th-primary-container)', fontSize: '28px' }}>refresh</span>
        <span style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-muted)', fontSize: '16px', marginLeft: '12px' }}>Loading roadmap…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <span className="material-symbols-outlined" style={{ color: 'var(--th-error)', fontSize: '48px', display: 'block', marginBottom: '16px' }}>error</span>
          <p style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: '20px', color: 'var(--th-on-surface)', marginBottom: '8px' }}>Failed to load roadmap</p>
          <p style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-muted)', marginBottom: '24px' }}>{error}</p>
          <Link to="/" className="btn-ghost">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!currentRoadmap) return null;

  const totalMilestones = progress?.total || 0;
  const completedMilestones = progress?.completed || 0;
  const progressPercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;
  const isAbandoned  = currentRoadmap.status === 'abandoned';
  const isGenerating = currentRoadmap.status === 'generating';

  return (
    <div className="page-bg min-h-screen pt-24 pb-16 px-4 md:px-12 animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 mb-8 transition-colors duration-200"
        style={{ color: 'var(--th-on-surface-variant)', textDecoration: 'none', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--th-primary-container)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--th-on-surface-variant)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        BACK TO DASHBOARD
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`pill-${currentRoadmap.status}`}>{currentRoadmap.status}</span>
              {currentRoadmap.targetTimeframe && (
                <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                  {currentRoadmap.targetTimeframe}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 4vw, 36px)', color: 'var(--th-on-surface)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {currentRoadmap.goal}
            </h1>
          </div>

          {!isGenerating && (
            <div className="flex gap-3 flex-shrink-0">
              {currentRoadmap.status === 'active' && (
                <button onClick={handleAbandon} className="btn-ghost py-2 px-4 text-sm" disabled={actionLoading === 'abandon'}>
                  {actionLoading === 'abandon'
                    ? <span className="material-symbols-outlined animate-spin-glow" style={{ fontSize: '16px' }}>refresh</span>
                    : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pause_circle</span>}
                  Abandon
                </button>
              )}
              <button onClick={handleDelete} className="btn-danger py-2 px-4 text-sm" disabled={actionLoading === 'delete'}>
                {actionLoading === 'delete'
                  ? <span className="material-symbols-outlined animate-spin-glow" style={{ fontSize: '16px' }}>refresh</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>}
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Generating banner */}
      {isGenerating && (
        <div className="mb-8 p-5 rounded-xl flex items-center gap-3"
          style={{ background: 'color-mix(in srgb, var(--th-secondary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--th-secondary) 25%, transparent)' }}>
          <span className="material-symbols-outlined animate-spin-glow" style={{ color: 'var(--th-secondary)', fontSize: '22px' }}>autorenew</span>
          <div>
            <p style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: '15px', color: 'var(--th-secondary)' }}>Still generating your roadmap…</p>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', marginTop: '4px' }}>Milestones will appear here once generation completes.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          {/* Progress */}
          <div className="card-flat" style={{ padding: '1.5rem' }}>
            <div className="flex justify-between items-baseline mb-4">
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '17px', color: 'var(--th-on-surface)' }}>
                Overall Progress
              </h2>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '30px', color: 'var(--th-primary-container)' }}>
                {progressPercent}%
              </span>
            </div>
            <div className="progress-track mb-2">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-muted)', textAlign: 'right' }}>
              {completedMilestones} / {totalMilestones} Milestones
            </p>
          </div>

          {/* Next Task */}
          {!isAbandoned && !isGenerating && (
            <NextTaskCard milestone={nextTask} onComplete={nextTask ? handleCompleteNextTask : null} />
          )}
        </aside>

        {/* Phases */}
        <main className="lg:col-span-8">
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '20px', color: 'var(--th-on-surface)' }}>
              Learning Phases
            </h2>
            <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-muted)' }}>
              {phases.length} phase{phases.length !== 1 ? 's' : ''}
            </span>
          </div>

          {phases.length === 0 && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl"
              style={{ border: '2px dashed var(--th-outline-variant)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--th-outline-variant)', fontSize: '40px', marginBottom: '12px' }}>route</span>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', color: 'var(--th-muted)' }}>No phases found for this roadmap.</p>
            </div>
          )}

          {phases.map((phase, index) => (
            <PhaseAccordion key={phase._id} phase={phase} roadmapId={id} phaseIndex={index} />
          ))}
        </main>
      </div>
    </div>
  );
}
