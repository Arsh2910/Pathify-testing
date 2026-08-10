import { useState } from 'react';
import MilestoneCard from './MilestoneCard';
import useRoadmapStore from '../store/roadmapStore';

export default function PhaseAccordion({ phase, roadmapId, phaseIndex }) {
  const [isOpen, setIsOpen] = useState(phaseIndex === 0);
  const [regenerating, setRegenerating] = useState(false);
  const { regeneratePhase } = useRoadmapStore();

  const milestones = phase.milestones || [];
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount    = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isPhaseComplete = totalCount > 0 && completedCount === totalCount;

  const handleRegenerate = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Regenerate phase "${phase.title}"? This will replace all milestones.`)) return;
    setRegenerating(true);
    try { await regeneratePhase(roadmapId, phase._id); }
    catch (err) { alert(err.response?.data?.message || 'Failed to regenerate phase'); }
    finally { setRegenerating(false); }
  };

  return (
    <div
      className="rounded-xl overflow-hidden mb-3"
      style={{
        background: 'var(--th-card-bg)',
        border: '1px solid var(--th-card-border)',
        boxShadow: 'var(--th-card-shadow)',
        transition: 'background 0.25s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left group transition-colors duration-200"
        style={{ background: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--th-primary-container) 4%, transparent)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Phase number */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: isPhaseComplete
                ? 'color-mix(in srgb, var(--th-primary-container) 18%, transparent)'
                : 'var(--th-surface-container)',
              color: isPhaseComplete ? 'var(--th-primary-container)' : 'var(--th-on-surface-variant)',
              border: `1px solid ${isPhaseComplete ? 'color-mix(in srgb, var(--th-primary-container) 35%, transparent)' : 'var(--th-outline-variant)'}`,
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            {phaseIndex + 1}
          </div>

          <div className="flex-1 min-w-0">
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '15px', color: 'var(--th-on-surface)', marginBottom: '5px' }}>
              {phase.title}
            </h3>
            <div className="flex items-center gap-3">
              <div className="progress-track" style={{ width: '80px' }}>
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--th-muted)', fontFamily: 'Hanken Grotesk' }}>
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Regenerate */}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="hidden group-hover:flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: 'color-mix(in srgb, var(--th-secondary) 10%, transparent)',
              color: 'var(--th-secondary)',
              border: '1px solid color-mix(in srgb, var(--th-secondary) 25%, transparent)',
              fontFamily: 'Hanken Grotesk', fontWeight: 600,
            }}
            title="Regenerate phase"
          >
            <span className={`material-symbols-outlined text-sm ${regenerating ? 'animate-spin-glow' : ''}`}>refresh</span>
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </button>

          {/* Arrow */}
          <span className="material-symbols-outlined transition-transform duration-300"
            style={{ color: 'var(--th-on-surface-variant)', fontSize: '20px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--th-card-border)' }}>
          {milestones.length === 0 ? (
            <div className="p-6 text-center" style={{ color: 'var(--th-muted)', fontFamily: 'Hanken Grotesk' }}>
              No milestones yet.
            </div>
          ) : (
            <div className="relative p-5 pl-8">
              {/* Trail line */}
              <div className="absolute left-[28px] top-5 bottom-5 w-0.5" style={{ background: 'var(--th-trail-line)' }} />
              <div className="flex flex-col gap-4">
                {milestones.map((milestone, idx) => (
                  <MilestoneCard key={milestone._id} milestone={milestone} isFirst={idx === 0} isLast={idx === milestones.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
