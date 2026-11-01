import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';
import useAuthStore from '../store/authStore';
import PhaseAccordion from '../components/PhaseAccordion';
import NextTaskCard from '../components/NextTaskCard';
import ResourceDrawer from '../components/ResourceDrawer';
import { exportRoadmapToCalendar } from '../utils/calendarExport';

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

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'abandon';
  }>({
    isOpen: false,
    type: 'delete',
  });

  useEffect(() => {
    fetchRoadmapDetail(id!);
    fetchNextTask(id!);
  }, [id, fetchRoadmapDetail, fetchNextTask]);

  const handleCompleteNextTask = async (milestoneId: string) => {
    try {
      const { streak } = await completeMilestone(milestoneId, true);
      if (streak) updateStreak(streak);
      fetchNextTask(id!);
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to complete milestone');
    }
  };

  const handleConfirmAction = async () => {
    const { type } = confirmModal;
    setActionLoading(type);
    try {
      if (type === 'abandon') {
        await abandonRoadmap(id!);
      } else if (type === 'delete') {
        await deleteRoadmap(id!);
        navigate('/');
      }
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || `Failed to ${type} roadmap`);
    } finally {
      setActionLoading('');
      setConfirmModal({ isOpen: false, type: 'delete' });
    }
  };

  // Export to Markdown file
  const handleExportMarkdown = () => {
    if (!currentRoadmap) return;

    let md = `# GoalWeave Roadmap: ${currentRoadmap.goal}\n\n`;
    md += `- **Status**: ${currentRoadmap.status.toUpperCase()}\n`;
    md += `- **Skill Level**: ${currentRoadmap.skillLevel}\n`;
    md += `- **Target Timeframe**: ${currentRoadmap.targetTimeframe || 'Self-paced'}\n`;
    md += `- **Daily Commitment**: ${currentRoadmap.hoursPerDay} hours/day\n`;
    md += `- **Progress**: ${progress?.completed || 0} / ${progress?.total || 0} milestones completed (${progressPercent}%)\n\n`;
    md += `---\n\n`;

    phases.forEach((phase, pIdx) => {
      md += `## Phase ${pIdx + 1}: ${phase.title}\n\n`;
      phase.milestones.forEach((m, mIdx) => {
        md += `### ${pIdx + 1}.${mIdx + 1} ${m.title} ${m.isCompleted ? '✅ (Completed)' : '⬜'}\n`;
        if (m.suggestedTimeBox) md += `*Time Estimate*: ${m.suggestedTimeBox}\n\n`;
        if (m.description) md += `${m.description}\n\n`;
        if (m.microFirstStep) md += `> **Micro First Step**: ${m.microFirstStep}\n\n`;
        if (m.whyNow) md += `> **Why Now**: ${m.whyNow}\n\n`;
        if (m.notes) md += `**My Notes**: ${m.notes}\n\n`;
        if (m.resources && m.resources.length > 0) {
          md += `**Resources**:\n`;
          m.resources.forEach((r) => {
            md += `- [${r.title}](${r.link}) (${r.type})\n`;
          });
          md += `\n`;
        }
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = currentRoadmap.goal.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.setAttribute('download', `goalweave_${safeName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const progressPercent = progress
    ? Math.round((progress.completed / Math.max(progress.total, 1)) * 100)
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
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Export Markdown */}
              <button
                onClick={handleExportMarkdown}
                className="btn-ghost py-2 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                title="Download Roadmap as Markdown"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                Export Markdown
              </button>

              {/* Print / Save as PDF */}
              <button
                onClick={() => window.print()}
                className="btn-ghost py-2 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                title="Print or Save as PDF"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                Print / PDF
              </button>

              {/* Add to Calendar (.ics) */}
              <button
                onClick={() => exportRoadmapToCalendar(currentRoadmap, phases)}
                className="btn-ghost py-2 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                title="Add Milestones to Google Calendar or Apple Calendar (.ics)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                Sync Calendar
              </button>

              {currentRoadmap.status === 'active' && (
                <button
                  onClick={() => setConfirmModal({ isOpen: true, type: 'abandon' })}
                  className="btn-ghost py-2 px-3 text-xs cursor-pointer"
                  disabled={actionLoading === 'abandon'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pause_circle</span>
                  Abandon
                </button>
              )}

              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'delete' })}
                className="btn-danger py-2 px-3 text-xs cursor-pointer"
                disabled={actionLoading === 'delete'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
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
              {progress?.completed || 0} / {progress?.total || 0} Milestones
            </p>
          </div>

          {/* 100% Completion Celebration Banner */}
          {progressPercent === 100 && (
            <div
              className="p-5 rounded-xl border flex flex-col items-center text-center animate-fade-in"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--th-primary-container) 15%, transparent), color-mix(in srgb, #f59e0b 15%, transparent))',
                borderColor: 'var(--th-primary-container)',
              }}
            >
              <span className="material-symbols-outlined text-amber-500 text-4xl mb-2 animate-bounce">
                military_tech
              </span>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--th-on-surface)' }}>
                Goal Mastered!
              </h3>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', marginTop: '4px' }}>
                You completed every milestone in this roadmap. Outstanding perseverance!
              </p>
            </div>
          )}

          {/* Next Task */}
          {!isAbandoned && !isGenerating && progressPercent < 100 && (
            <NextTaskCard milestone={nextTask} onComplete={nextTask ? handleCompleteNextTask : null} />
          )}

          {/* Quick References Resource Hub */}
          <ResourceDrawer roadmapId={currentRoadmap._id} phases={phases} />
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
            <PhaseAccordion key={phase._id} phase={phase} roadmapId={id!} phaseIndex={index} />
          ))}
        </main>
      </div>

      {/* Styled Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm p-6 rounded-2xl shadow-2xl"
            style={{
              background: 'var(--th-surface-container)',
              border: '1px solid var(--th-outline-variant)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '28px',
                  color: confirmModal.type === 'delete' ? 'var(--th-error)' : 'var(--th-primary-container)',
                }}
              >
                {confirmModal.type === 'delete' ? 'delete_forever' : 'pause_circle'}
              </span>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--th-on-surface)' }}>
                {confirmModal.type === 'delete' ? 'Delete Roadmap?' : 'Abandon Roadmap?'}
              </h3>
            </div>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-on-surface-variant)' }}
            >
              {confirmModal.type === 'delete'
                ? `Are you sure you want to permanently delete "${currentRoadmap.goal}"? This action cannot be undone.`
                : `Are you sure you want to mark "${currentRoadmap.goal}" as abandoned?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: 'delete' })}
                className="btn-ghost py-2 px-4 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={Boolean(actionLoading)}
                className="py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: confirmModal.type === 'delete' ? 'var(--th-error)' : 'var(--th-primary-container)',
                  color: 'white',
                }}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
