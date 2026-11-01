import { useState, useEffect, useRef } from 'react';
import useRoadmapStore, { type Milestone, type BabyStep } from '../store/roadmapStore';
import useAuthStore from '../store/authStore';
import FocusSessionModal from './FocusSessionModal';
import MilestoneQuizModal from './MilestoneQuizModal';
import { fireConfetti, fireGrandCelebration } from '../utils/confetti';
import { toast } from '../store/toastStore';

const resourceTypeIcon = {
  video:   'play_circle',
  article: 'article',
  course:  'school',
  book:    'menu_book',
  other:   'link',
};

function getMilestoneTag(title: string, desc?: string): { label: string; icon: string } {
  const text = `${title} ${desc || ''}`.toLowerCase();
  if (text.match(/project|build a full|portfolio|capstone|deploy/i)) {
    return { label: 'Project', icon: 'construction' };
  }
  if (text.match(/code|implement|function|api|component|hook|script|program|setup/i)) {
    return { label: 'Code', icon: 'code' };
  }
  if (text.match(/review|quiz|practice|exercise|interview|debug/i)) {
    return { label: 'Practice', icon: 'psychology' };
  }
  return { label: 'Concept', icon: 'menu_book' };
}

export default function MilestoneCard({ milestone, isFirst }: { milestone: Milestone; isFirst: boolean; isLast?: boolean }) {
  const [loading, setLoading]                 = useState(false);
  const [showDetails, setShowDetails]         = useState(false);
  const [notes, setNotes]                     = useState(milestone.notes || '');
  const [saveStatus, setSaveStatus]           = useState<'idle' | 'saving' | 'saved'>('idle');
  const [focusModalOpen, setFocusModalOpen]   = useState(false);
  const [quizModalOpen, setQuizModalOpen]     = useState(false);
  const [babySteps, setBabySteps]             = useState<BabyStep[] | null>(null);
  const [loadingBabySteps, setLoadingBabySteps] = useState(false);
  const [completedBabySteps, setCompletedBabySteps] = useState<Record<number, boolean>>({});

  const { completeMilestone, updateMilestoneNotes, breakdownMilestone } = useRoadmapStore();
  const { updateStreak }                                                = useAuthStore();
  const isInitialMount = useRef(true);

  // Debounced auto-save for study notes (saves 750ms after user stops typing)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (notes === (milestone.notes || '')) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateMilestoneNotes(milestone._id, notes);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('idle');
        toast.error('Failed to auto-save notes');
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [notes, milestone._id, milestone.notes, updateMilestoneNotes]);

  const handleToggle = async (e?: React.MouseEvent) => {
    if (loading) return;
    setLoading(true);
    const willBeCompleted = !milestone.isCompleted;
    if (willBeCompleted) {
      const rect = (e?.target as HTMLElement)?.getBoundingClientRect?.();
      fireConfetti(rect ? rect.left + rect.width / 2 : undefined, rect ? rect.top : undefined);
    }
    try {
      const { streak, progress } = await completeMilestone(milestone._id, willBeCompleted);
      if (streak) updateStreak(streak);
      if (willBeCompleted) {
        toast.success(`Completed "${milestone.title}"!`);
      }
      if (progress && progress.total > 0 && progress.completed === progress.total) {
        fireGrandCelebration();
        toast.success('Congratulations! You completed the entire roadmap! 🏆');
      }
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (e?: React.MouseEvent, appendedText?: string) => {
    if (e) e.stopPropagation();
    const contentToSave = appendedText !== undefined ? appendedText : notes;
    setSaveStatus('saving');
    try {
      await updateMilestoneNotes(milestone._id, contentToSave);
      setSaveStatus('saved');
      toast.success('Notes saved!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('idle');
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save notes');
    }
  };

  const handleBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingBabySteps) return;
    if (babySteps) {
      setBabySteps(null); // toggle closed if already open
      return;
    }
    setLoadingBabySteps(true);
    try {
      const steps = await breakdownMilestone(milestone._id);
      setBabySteps(steps);
      setShowDetails(true); // make sure details are expanded
      toast.success('Baby steps generated! Small actions break procrastination.');
    } catch {
      toast.error('Unable to generate baby steps right now. Please try again.');
    } finally {
      setLoadingBabySteps(false);
    }
  };

  const handleToggleBabyStep = (index: number) => {
    setCompletedBabySteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAppendStepsToNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!babySteps) return;
    const formatted = babySteps
      .map((s, i) => `[ ] Step ${i + 1} (${s.timeEstimate}): ${s.title} — ${s.action}`)
      .join('\n');
    const newNotes = notes.trim() ? `${notes}\n\nBaby Steps:\n${formatted}` : `Baby Steps:\n${formatted}`;
    setNotes(newNotes);
    handleSaveNotes(undefined, newNotes);
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
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border"
                  style={{
                    backgroundColor: 'var(--th-surface-container-high)',
                    borderColor: 'var(--th-outline-variant)',
                    color: 'var(--th-on-surface-variant)',
                    fontFamily: 'Hanken Grotesk',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                    {getMilestoneTag(milestone.title, milestone.description).icon}
                  </span>
                  {getMilestoneTag(milestone.title, milestone.description).label}
                </span>

                {milestone.suggestedTimeBox && (
                  <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 600, color: 'var(--th-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                    {milestone.suggestedTimeBox}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className="material-symbols-outlined transition-transform duration-200"
              style={{
                color: 'var(--th-on-surface-variant)',
                fontSize: '20px',
                transform: showDetails ? 'rotate(180deg)' : 'rotate(0)',
                flexShrink: 0,
              }}
            >
              expand_more
            </span>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 space-y-4" style={{ borderTop: '1px solid var(--th-outline-variant)' }}>
            
            {/* Dedicated Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap pb-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setFocusModalOpen(true)}
                title="Start Pomodoro Focus Session on this milestone"
                className="btn-primary py-1.5 px-3.5 text-xs rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '15px' }}>timer</span>
                <span>Focus Session</span>
              </button>

              <button
                type="button"
                onClick={handleBreakdown}
                disabled={loadingBabySteps}
                title="Break down milestone into 3 effortless baby steps"
                className="btn-ghost py-1.5 px-3 text-xs rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--th-secondary)' }}>
                  {loadingBabySteps ? 'sync' : 'psychology'}
                </span>
                <span>{loadingBabySteps ? 'Breaking down...' : "I'm Stuck"}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizModalOpen(true)}
                title="Quick 3-question active recall quiz"
                className="btn-ghost py-1.5 px-3 text-xs rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--th-primary-container)' }}>
                  quiz
                </span>
                <span>Comprehension Quiz</span>
              </button>
            </div>

            {milestone.description && (
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', lineHeight: '21px' }}>
                {milestone.description}
              </p>
            )}

            {/* AI Inertia Breaker Baby Steps Box */}
            {(babySteps || loadingBabySteps) && (
              <div
                className="p-3.5 rounded-2xl border transition-all animate-fade-in"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--th-secondary) 8%, var(--th-surface-container))',
                  borderColor: 'color-mix(in srgb, var(--th-secondary) 25%, transparent)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ color: 'var(--th-secondary)', fontSize: '16px' }}>psychology</span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--th-secondary)' }}>
                      Inertia Breaker: 3 Micro Baby Steps
                    </span>
                  </div>
                  {babySteps && (
                    <button
                      type="button"
                      onClick={handleAppendStepsToNotes}
                      title="Save these steps to your study notes below"
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:underline flex items-center gap-1"
                      style={{ color: 'var(--th-secondary)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>content_paste</span>
                      Copy to Notes
                    </button>
                  )}
                </div>

                {loadingBabySteps ? (
                  <div className="flex items-center gap-2 py-3 text-xs opacity-70">
                    <span className="animate-spin material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span>
                    <span>Deconstructing milestone into effortless 2-minute steps...</span>
                  </div>
                ) : babySteps && (
                  <div className="space-y-2">
                    {babySteps.map((step, idx) => {
                      const isDone = !!completedBabySteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleBabyStep(idx)}
                          className="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition"
                          style={{
                            backgroundColor: isDone
                              ? 'color-mix(in srgb, var(--th-primary) 10%, transparent)'
                              : 'var(--th-surface-container)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}} // handled by parent div
                            className="mt-0.5 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-bold"
                                style={{
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  color: isDone ? 'var(--th-muted)' : 'var(--th-on-surface)',
                                }}
                              >
                                Step {idx + 1}: {step.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10 opacity-75">
                                {step.timeEstimate}
                              </span>
                            </div>
                            <p
                              className="text-xs mt-0.5 leading-relaxed opacity-85"
                              style={{
                                textDecoration: isDone ? 'line-through' : 'none',
                                color: isDone ? 'var(--th-muted)' : 'var(--th-on-surface-variant)',
                              }}
                            >
                              {step.action}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-medium flex items-center gap-1">
                    {saveStatus === 'saving' && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] animate-spin-glow">sync</span>
                        Auto-saving...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Auto-saved ✓
                      </span>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="opacity-50 text-[10px]">Auto-saved as you type</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSaveNotes(e)}
                    disabled={saveStatus === 'saving'}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                    style={{
                      background: 'var(--th-surface-container)',
                      color: 'var(--th-on-surface)',
                      border: '1px solid var(--th-outline-variant)',
                    }}
                    title="Force immediate save"
                  >
                    Save now
                  </button>
                </div>
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

      {focusModalOpen && (
        <FocusSessionModal
          milestone={milestone}
          isOpen={focusModalOpen}
          onClose={() => setFocusModalOpen(false)}
          onCompleteMilestone={async () => {
            await handleToggle();
          }}
        />
      )}

      {quizModalOpen && (
        <MilestoneQuizModal
          milestone={milestone}
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          onMilestoneCompleted={() => {
            handleToggle();
          }}
        />
      )}
    </div>
  );
}
