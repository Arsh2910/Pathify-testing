import { useState } from 'react';
import MilestoneCard from './MilestoneCard';
import useRoadmapStore, { type Phase } from '../store/roadmapStore';

export default function PhaseAccordion({ phase, roadmapId, phaseIndex }: { phase: Phase; roadmapId: string; phaseIndex: number }) {
  const [isOpen, setIsOpen] = useState(phaseIndex === 0);
  const [regenerating, setRegenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  const { regeneratePhase, addCustomMilestone } = useRoadmapStore();

  const milestones = phase.milestones || [];
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount    = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isPhaseComplete = totalCount > 0 && completedCount === totalCount;

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Regenerate phase "${phase.title}"? This will replace all milestones.`)) return;
    setRegenerating(true);
    try { await regeneratePhase(roadmapId, phase._id); }
    catch (err) { alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to regenerate phase'); }
    finally { setRegenerating(false); }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || addingMilestone) return;
    setAddingMilestone(true);
    try {
      await addCustomMilestone(roadmapId, phase._id, newMilestoneTitle.trim());
      setNewMilestoneTitle('');
      setShowAddForm(false);
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add milestone');
    } finally {
      setAddingMilestone(false);
    }
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
        className="w-full flex items-center justify-between p-5 text-left group transition-colors duration-200 cursor-pointer"
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
              color: isPhaseComplete ? 'var(--th-primary)' : 'var(--th-on-surface-variant)',
            }}
          >
            {isPhaseComplete ? (
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px' }}>check</span>
            ) : (
              phaseIndex + 1
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '15px',
              color: 'var(--th-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {phase.title}
            </h3>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-muted)', marginTop: '2px' }}>
              {completedCount} of {totalCount} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Progress % */}
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'var(--th-muted)' }}>
            {progressPercent}%
          </span>

          {/* Regenerate button */}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="hidden sm:inline-flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs transition-opacity duration-200 cursor-pointer"
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

          {/* Add Milestone Footer */}
          <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-[var(--th-card-border)] flex items-center justify-between">
            {showAddForm ? (
              <form onSubmit={handleCreateMilestone} className="flex-1 flex gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Enter milestone title (e.g., Build a quick prototype)..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="input-field py-1.5 text-xs flex-1"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={addingMilestone}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  {addingMilestone ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                style={{ color: 'var(--th-primary-container)', fontFamily: 'Hanken Grotesk' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                Add Custom Milestone
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
