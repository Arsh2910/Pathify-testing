import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useRoadmapStore, { Milestone, QuizQuestion } from '../store/roadmapStore';
import { fireConfetti } from '../utils/confetti';
import { toast } from '../store/toastStore';

interface MilestoneQuizModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onMilestoneCompleted: () => void;
}

export const MilestoneQuizModal: React.FC<MilestoneQuizModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onMilestoneCompleted,
}) => {
  const { getMilestoneQuiz, completeMilestone } = useRoadmapStore();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setSelectedAnswers({});
      setLoading(true);
      getMilestoneQuiz(milestone._id)
        .then((data) => setQuestions(data))
        .catch(() => toast.error('Could not load quiz questions. Please try again.'))
        .finally(() => setLoading(false));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, milestone._id, onClose]);

  if (!isOpen) return null;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    if (!questions) return 0;
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) score++;
    });
    return score;
  };

  const allAnswered = questions && Object.keys(selectedAnswers).length === questions.length;
  const score = calculateScore();
  const passed = score >= 2;

  const handleSubmit = () => {
    setSubmitted(true);
    if (passed) {
      fireConfetti();
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const handleCompleteMilestone = async () => {
    setIsCompleting(true);
    try {
      await completeMilestone(milestone._id, true);
      toast.success('Milestone mastered and marked complete! 🎉');
      onMilestoneCompleted();
      onClose();
    } catch {
      toast.error('Failed to mark milestone complete');
    } finally {
      setIsCompleting(false);
    }
  };

  const modalJSX = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-2xl shadow-2xl relative animate-scale-in my-auto border"
        style={{
          background: 'var(--th-surface-container)',
          borderColor: 'var(--th-outline-variant)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--th-outline-variant)]">
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined icon-fill"
              style={{ color: 'var(--th-primary-container)', fontSize: '24px' }}
            >
              quiz
            </span>
            <div>
              <h3
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: '17px',
                  color: 'var(--th-on-surface)',
                  lineHeight: '22px',
                }}
              >
                Comprehension Check
              </h3>
              <p
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  fontSize: '11px',
                  color: 'var(--th-muted)',
                }}
              >
                Active recall quiz to test and solidify your mastery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-xs cursor-pointer transition text-gray-400 hover:text-gray-200"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Milestone info banner */}
        <div
          className="mt-4 p-3 rounded-xl border border-[var(--th-outline-variant)] flex items-center gap-2.5"
          style={{ background: 'var(--th-surface-container-low)' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--th-primary-container)', fontSize: '18px' }}
          >
            school
          </span>
          <p
            className="text-xs font-semibold truncate"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--th-on-surface)' }}
          >
            {milestone.title}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: '32px', color: 'var(--th-primary-container)' }}
            >
              sync
            </span>
            <p
              className="text-xs font-medium opacity-70"
              style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
            >
              Generating 3 tailored comprehension questions...
            </p>
          </div>
        )}

        {/* Questions list */}
        {!loading && questions && (
          <div className="mt-5 space-y-6">
            {questions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              return (
                <div
                  key={qIdx}
                  className="p-4 rounded-xl border border-[var(--th-outline-variant)]"
                  style={{ background: 'var(--th-surface-container-low)' }}
                >
                  <p
                    className="text-xs sm:text-sm font-semibold mb-3"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--th-on-surface)' }}
                  >
                    <span className="text-emerald-500 mr-1.5 font-bold">Q{qIdx + 1}.</span>
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      const isCorrect = q.correctAnswerIndex === optIdx;

                      let optBg = 'var(--th-surface-container-high)';
                      let optBorder = 'var(--th-outline-variant)';
                      let optColor = 'var(--th-on-surface)';

                      if (submitted) {
                        if (isCorrect) {
                          optBg = 'color-mix(in srgb, var(--th-primary-container) 25%, transparent)';
                          optBorder = 'var(--th-primary-container)';
                          optColor = 'var(--th-primary-container)';
                        } else if (isChosen && !isCorrect) {
                          optBg = 'rgba(239, 68, 68, 0.15)';
                          optBorder = 'rgba(239, 68, 68, 0.5)';
                          optColor = '#ef4444';
                        }
                      } else if (isChosen) {
                        optBg = 'color-mix(in srgb, var(--th-primary-container) 15%, transparent)';
                        optBorder = 'var(--th-primary-container)';
                        optColor = 'var(--th-primary-container)';
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                            submitted ? 'cursor-default' : 'hover:opacity-90'
                          }`}
                          style={{
                            background: optBg,
                            border: `1px solid ${optBorder}`,
                            color: optColor,
                            fontFamily: 'Hanken Grotesk, sans-serif',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold opacity-60 bg-black/10 dark:bg-white/10">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {submitted && isCorrect && (
                            <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '16px' }}>
                              check_circle
                            </span>
                          )}
                          {submitted && isChosen && !isCorrect && (
                            <span className="material-symbols-outlined text-red-500" style={{ fontSize: '16px' }}>
                              cancel
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-3 p-2.5 rounded-lg text-xs leading-relaxed opacity-90 border border-emerald-500/20 bg-emerald-500/5">
                      <span className="font-bold text-emerald-500">Explanation: </span>
                      <span style={{ color: 'var(--th-on-surface-variant)' }}>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Score & Actions */}
            {submitted ? (
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{
                  background: passed
                    ? 'color-mix(in srgb, var(--th-primary-container) 12%, transparent)'
                    : 'rgba(239, 68, 68, 0.08)',
                  borderColor: passed ? 'var(--th-primary-container)' : 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <div>
                  <h4
                    className="font-bold text-sm"
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      color: passed ? 'var(--th-primary-container)' : '#ef4444',
                    }}
                  >
                    {passed ? '🎉 Great Job! Concept Mastered!' : 'Needs a bit more review!'}
                  </h4>
                  <p className="text-xs opacity-70 mt-0.5" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    You scored {score} / 3 questions correctly.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="btn-ghost py-2 px-3.5 text-xs rounded-lg cursor-pointer flex-1 sm:flex-initial"
                  >
                    Retake Quiz
                  </button>

                  {passed && !milestone.isCompleted && (
                    <button
                      type="button"
                      onClick={handleCompleteMilestone}
                      disabled={isCompleting}
                      className="btn-primary py-2 px-4 text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                    >
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: '15px' }}>
                        check_circle
                      </span>
                      <span>{isCompleting ? 'Saving...' : 'Mark Complete'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="btn-primary py-2.5 px-6 rounded-lg text-xs cursor-pointer"
                  style={{ opacity: allAnswered ? 1 : 0.5 }}
                >
                  Submit & Check Answers
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};

export default MilestoneQuizModal;
