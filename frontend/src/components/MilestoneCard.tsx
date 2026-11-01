import { useState } from 'react';
import useRoadmapStore, { type Milestone } from '../store/roadmapStore';
import useAuthStore from '../store/authStore';

const resourceTypeIcon = {
  video:   'play_circle',
  article: 'article',
  course:  'school',
  book:    'menu_book',
  other:   'link',
};

export default function MilestoneCard({ milestone, isFirst }: { milestone: Milestone; isFirst: boolean; isLast?: boolean }) {
  const [loading, setLoading]         = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes]             = useState(milestone.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes]   = useState(false);

  const { completeMilestone, updateMilestoneNotes } = useRoadmapStore();
  const { updateStreak }                            = useAuthStore();

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { streak } = await completeMilestone(milestone._id, !milestone.isCompleted);
      if (streak) updateStreak(streak);
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (savingNotes) return;
    setSavingNotes(true);
    try {
      await updateMilestoneNotes(milestone._id, notes);
      setSavedNotes(true);
      setTimeout(() => setSavedNotes(false), 2000);
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const nodeStyle = milestone.isCompleted ? 'trail-node-complete' : isFirst ? 'trail-node-active' : 'trail-node-pending';

  return (
    <div className="relative flex gap-4 animate-fade-in">
      {/* Trail Node */}
      <div className="flex flex-col items-center z-10 -ml-4">
        <div className={nodeStyle}>
          {milestone.isCompleted && (
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '11px', color: 'var(--th-on-primary)' }}>check</span>
          )}
        </div>
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl p-4 cursor-pointer transition-all duration-200"
        style={{
          background: milestone.isCompleted
            ? 'color-mix(in srgb, var(--th-primary-container) 5%, var(--th-surface-container-low))'
            : 'var(--th-surface-container-low)',
          border: `1px solid ${milestone.isCompleted
            ? 'color-mix(in srgb, var(--th-primary-container) 20%, transparent)'
            : 'var(--th-outline-variant)'}`,
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              className="milestone-checkbox mt-0.5"
              checked={milestone.isCompleted}
              onChange={handleToggle}
              onClick={(e) => e.stopPropagation()}
              disabled={loading}
            />
            <div className="flex-1">
              <p style={{
                fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 600, fontSize: '14px',
                color: milestone.isCompleted ? 'var(--th-muted)' : 'var(--th-on-surface)',
                textDecoration: milestone.isCompleted ? 'line-through' : 'none',
                lineHeight: '20px',
              }}>
                {milestone.title}
              </p>
              {milestone.suggestedTimeBox && (
                <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 600, color: 'var(--th-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                  {milestone.suggestedTimeBox}
                </span>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined transition-transform duration-200" style={{ color: 'var(--th-on-surface-variant)', fontSize: '16px', transform: showDetails ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
            expand_more
          </span>
        </div>

        {/* Expanded */}
        {showDetails && (
          <div className="mt-4 pt-4 space-y-4" style={{ borderTop: '1px solid var(--th-outline-variant)' }}>
            {milestone.description && (
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', lineHeight: '21px' }}>
                {milestone.description}
              </p>
            )}

            {milestone.microFirstStep && (
              <div className="micro-step-box flex gap-3">
                <span className="material-symbols-outlined" style={{ color: 'var(--th-micro-step-color)', fontSize: '18px', flexShrink: 0 }}>bolt</span>
                <div>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-micro-step-color)', letterSpacing: '0.09em', marginBottom: '4px' }}>MICRO FIRST STEP</p>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface)', lineHeight: '20px' }}>{milestone.microFirstStep}</p>
                </div>
              </div>
            )}

            {milestone.whyNow && (
              <div className="why-now-box flex gap-3">
                <span className="material-symbols-outlined" style={{ color: 'var(--th-why-now-color)', fontSize: '18px', flexShrink: 0 }}>lightbulb</span>
                <div>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-why-now-color)', letterSpacing: '0.09em', marginBottom: '4px' }}>WHY NOW</p>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface)', lineHeight: '20px' }}>{milestone.whyNow}</p>
                </div>
              </div>
            )}

            {/* Resources */}
            {milestone.resources && milestone.resources.length > 0 && (
              <div>
                <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: 'var(--th-muted)', letterSpacing: '0.09em', marginBottom: '8px' }}>RESOURCES</p>
                <div className="flex flex-wrap gap-2">
                  {milestone.resources.map((r, i) => {
                    const safeLink =
                      !r.link
                        ? `https://www.google.com/search?q=${encodeURIComponent(`${r.title} ${milestone.title}`)}`
                        : (r.link.includes('youtube.com/watch') || r.link.includes('youtu.be/'))
                        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.title.replace(/tutorial|video|course/gi, '').trim()} ${milestone.title} tutorial`)}`
                        : r.link;

                    return (
                      <a key={i} href={safeLink} target="_blank" rel="noopener noreferrer"
                        className="resource-chip" onClick={(e) => e.stopPropagation()}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{resourceTypeIcon[r.type] || 'link'}</span>
                        {r.title}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Personal Study Notes */}
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_note</span>
                  MY STUDY NOTES & LOG
                </p>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                  style={{
                    background: savedNotes ? 'var(--th-primary-container)' : 'var(--th-surface-container)',
                    color: savedNotes ? 'white' : 'var(--th-on-surface)',
                    border: '1px solid var(--th-outline-variant)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    {savedNotes ? 'check' : savingNotes ? 'refresh' : 'save'}
                  </span>
                  <span>{savedNotes ? 'Saved!' : savingNotes ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record key takeaways, personal code snippets, links, or hurdles..."
                rows={2}
                className="input-field text-xs resize-y"
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  padding: '8px 10px',
                  lineHeight: '1.4',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
