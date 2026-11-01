import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Milestone } from '../store/roadmapStore';

interface FocusSessionModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onCompleteMilestone: (milestoneId: string) => Promise<void>;
}

const PRESETS = [
  { label: '15m Micro Sprint', minutes: 15 },
  { label: '25m Pomodoro', minutes: 25 },
  { label: '45m Deep Work', minutes: 45 },
];

export const FocusSessionModal: React.FC<FocusSessionModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onCompleteMilestone,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play harmonic Tibetan singing bowl chime via Web Audio API
  const playFocusBell = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // Frequencies for a clear, resonant harmonic chime (528 Hz base)
      const harmonics = [528, 1056, 1584];
      harmonics.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const initialVolume = 0.22 / (idx + 1);
        gain.gain.setValueAtTime(initialVolume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 3.3);
      });
    } catch (err) {
      console.warn('AudioContext unavailable:', err);
    }
  };

  const targetEndTimeRef = useRef<number | null>(null);

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(false);
    setSessionCompleted(false);
    targetEndTimeRef.current = null;
    localStorage.removeItem(`gw_focus_${milestone._id}`);
  };

  // Restore existing running session if one was active for this milestone
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(`gw_focus_${milestone._id}`);
        if (saved) {
          const parsed = JSON.parse(saved) as { targetEndTime: number; selectedMinutes: number };
          const remainingSecs = Math.round((parsed.targetEndTime - Date.now()) / 1000);
          if (remainingSecs > 0) {
            setSelectedMinutes(parsed.selectedMinutes);
            setSecondsRemaining(remainingSecs);
            targetEndTimeRef.current = parsed.targetEndTime;
            setIsActive(true);
            return;
          } else {
            localStorage.removeItem(`gw_focus_${milestone._id}`);
          }
        }
      } catch {
        // Ignore parse error
      }

      setSecondsRemaining(selectedMinutes * 60);
      setIsActive(false);
      setSessionCompleted(false);
      targetEndTimeRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, milestone._id]);

  // Delta-based timer (prevents tab-throttling drift and maintains exact time)
  useEffect(() => {
    if (isActive) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
        localStorage.setItem(
          `gw_focus_${milestone._id}`,
          JSON.stringify({
            targetEndTime: targetEndTimeRef.current,
            selectedMinutes,
          })
        );
      }

      timerRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));

        setSecondsRemaining(diffSeconds);

        if (diffSeconds <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          targetEndTimeRef.current = null;
          localStorage.removeItem(`gw_focus_${milestone._id}`);
          setIsActive(false);
          setSessionCompleted(true);
          playFocusBell();
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      targetEndTimeRef.current = null;
      localStorage.removeItem(`gw_focus_${milestone._id}`);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, milestone._id, selectedMinutes]);

  // Keyboard accessibility: Space toggles, Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (
        e.key === ' ' &&
        (e.target as HTMLElement).tagName !== 'BUTTON' &&
        (e.target as HTMLElement).tagName !== 'INPUT'
      ) {
        e.preventDefault();
        setIsActive((prev) => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSeconds = selectedMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const progressPercent = progressRatio * 100;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 68; // radius 68
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      playFocusBell();
      await onCompleteMilestone(milestone._id);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
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
        className="w-full max-w-lg p-6 sm:p-7 rounded-2xl shadow-2xl relative animate-scale-in my-auto"
        style={{
          background: 'var(--th-surface-container)',
          border: '1px solid var(--th-outline-variant)',
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
              timer
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
                Focus Session
              </h3>
              <p
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  fontSize: '11px',
                  color: 'var(--th-muted)',
                }}
              >
                Single-task focus mode to eliminate friction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime on completion: Enabled' : 'Chime on completion: Muted'}
              className="p-1.5 rounded-lg text-xs cursor-pointer transition flex items-center justify-center hover:opacity-80"
              style={{
                color: soundEnabled ? 'var(--th-primary-container)' : 'var(--th-muted)',
                background: 'var(--th-surface-container-high)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {soundEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-xs cursor-pointer transition flex items-center justify-center hover:opacity-80 text-gray-400 hover:text-gray-200"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* Milestone Context Box */}
        <div
          className="mt-4 p-3.5 rounded-xl border border-[var(--th-outline-variant)]"
          style={{ background: 'var(--th-surface-container-low)' }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              style={{
                fontFamily: 'Hanken Grotesk',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--th-primary-container)',
                letterSpacing: '0.08em',
              }}
            >
              CURRENT TARGET
            </span>
            {milestone.suggestedTimeBox && (
              <span
                style={{
                  fontFamily: 'Hanken Grotesk',
                  fontSize: '11px',
                  color: 'var(--th-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                  schedule
                </span>
                {milestone.suggestedTimeBox}
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--th-on-surface)',
              lineHeight: '20px',
            }}
            className="line-clamp-2"
          >
            {milestone.title}
          </p>

          {/* Micro First Step Banner */}
          {milestone.microFirstStep && (
            <div className="micro-step-box flex gap-2.5 mt-2.5 p-2.5">
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--th-micro-step-color)', fontSize: '16px', flexShrink: 0 }}
              >
                bolt
              </span>
              <div>
                <p
                  style={{
                    fontFamily: 'Hanken Grotesk',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--th-micro-step-color)',
                    letterSpacing: '0.09em',
                    marginBottom: '2px',
                  }}
                >
                  START WITH THIS MICRO ACTION
                </p>
                <p
                  style={{
                    fontFamily: 'Hanken Grotesk',
                    fontSize: '12px',
                    color: 'var(--th-on-surface)',
                    lineHeight: '17px',
                  }}
                >
                  {milestone.microFirstStep}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preset Selector Chips */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {PRESETS.map((p) => {
            const isSelected = selectedMinutes === p.minutes;
            return (
              <button
                key={p.minutes}
                type="button"
                onClick={() => handleSelectPreset(p.minutes)}
                className="py-2 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--th-primary-container) 15%, transparent)'
                    : 'var(--th-surface-container-high)',
                  border: `1px solid ${
                    isSelected ? 'var(--th-primary-container)' : 'var(--th-outline-variant)'
                  }`,
                  color: isSelected ? 'var(--th-primary-container)' : 'var(--th-on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimalist Gauge & Clock */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative flex items-center justify-center w-48 h-48 sm:w-52 sm:h-52">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track Circle */}
              <circle
                cx="80"
                cy="80"
                r="68"
                stroke="var(--th-outline-variant)"
                strokeWidth="6"
                strokeOpacity="0.25"
                fill="transparent"
              />
              {/* Active Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r="68"
                stroke="var(--th-primary-container)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--th-primary-container) 45%, transparent))',
                }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: '40px',
                  color: 'var(--th-on-surface)',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                }}
              >
                {formattedTime}
              </span>

              <div className="mt-2">
                {sessionCompleted ? (
                  <span className="pill-base pill-completed flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                      check_circle
                    </span>
                    Time Completed!
                  </span>
                ) : isActive ? (
                  <span className="pill-base pill-active flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ background: 'currentColor' }}
                    />
                    In Focus
                  </span>
                ) : (
                  <span className="pill-base pill-generating flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                      pause
                    </span>
                    Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Reset button */}
          <button
            type="button"
            onClick={() => handleSelectPreset(selectedMinutes)}
            title="Reset timer"
            className="btn-ghost py-2.5 px-3.5 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              restart_alt
            </span>
          </button>

          {/* Primary Play/Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="btn-primary py-2.5 px-6 rounded-lg cursor-pointer min-w-[150px]"
          >
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px' }}>
              {isActive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>

          {/* Preview chime test */}
          <button
            type="button"
            onClick={playFocusBell}
            title="Preview completion bell"
            className="btn-ghost py-2.5 px-3.5 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              volume_up
            </span>
          </button>
        </div>

        {/* Modal Footer / Fast Milestone Completion */}
        <div className="mt-6 pt-4 border-t border-[var(--th-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            style={{
              fontFamily: 'Hanken Grotesk, sans-serif',
              fontSize: '11px',
              color: 'var(--th-muted)',
            }}
          >
            Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Space</kbd> to toggle,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Esc</kbd> to exit
          </p>

          <button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting || milestone.isCompleted}
            className="btn-primary py-1.5 px-3.5 text-xs rounded-lg cursor-pointer w-full sm:w-auto"
            style={{
              background: milestone.isCompleted ? 'var(--th-surface-container-high)' : undefined,
              color: milestone.isCompleted ? 'var(--th-muted)' : undefined,
              border: milestone.isCompleted ? '1px solid var(--th-outline-variant)' : undefined,
            }}
          >
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '15px' }}>
              check_circle
            </span>
            <span>{milestone.isCompleted ? 'Completed' : isCompleting ? 'Saving...' : 'Mark Done'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};

export default FocusSessionModal;
