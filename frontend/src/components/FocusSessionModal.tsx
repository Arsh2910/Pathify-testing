import React, { useState, useEffect, useRef } from 'react';
import { Milestone } from '../store/roadmapStore';

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
  const [completedCelebration, setCompletedCelebration] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthesized bell chime using Web Audio API
  const playFocusBell = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // Tibetan bowl harmonic sound: base tone + overtone + soft decay
      const tones = [528, 1056, 1584]; // 528 Hz is the "clarity" frequency
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Volume envelope
        const initialGain = 0.25 / (i + 1);
        gain.gain.setValueAtTime(initialGain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 3.6);
      });
    } catch (err) {
      console.warn('AudioContext not permitted or supported:', err);
    }
  };

  // Reset timer when minutes preset changes or modal opens
  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(selectedMinutes * 60);
      setIsActive(false);
      setCompletedCelebration(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, milestone._id]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            playFocusBell();
            setCompletedCelebration(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsRemaining]);

  // Keyboard shortcut: Space toggles timer, Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
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
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      playFocusBell();
      await onCompleteMilestone(milestone._id);
      setCompletedCelebration(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl transition-all border"
        style={{
          backgroundColor: 'var(--th-surface)',
          borderColor: 'var(--th-border)',
          color: 'var(--th-text)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--th-border)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isActive ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isActive ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <h2 className="text-lg font-bold">Focus Mode Session</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sound alerts enabled' : 'Muted'}
              className="p-1.5 rounded-lg text-sm hover:opacity-80 transition"
              style={{ backgroundColor: 'var(--th-surface-container)' }}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sm hover:opacity-80 transition text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Milestone info */}
        <div className="mt-4 p-3.5 rounded-2xl" style={{ backgroundColor: 'var(--th-surface-container)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">
            Current Target
          </div>
          <div className="font-semibold text-base line-clamp-1">{milestone.title}</div>
          {milestone.microFirstStep && (
            <div className="mt-2 text-xs flex items-start gap-1.5 text-emerald-400/90 bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/20">
              <span className="text-sm">⚡</span>
              <span>
                <strong>First Action:</strong> {milestone.microFirstStep}
              </span>
            </div>
          )}
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              onClick={() => handleSelectPreset(p.minutes)}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition ${
                selectedMinutes === p.minutes && !isActive
                  ? 'ring-2 ring-primary font-bold shadow-md'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor:
                  selectedMinutes === p.minutes
                    ? 'var(--th-primary)'
                    : 'var(--th-surface-container)',
                color: selectedMinutes === p.minutes ? '#ffffff' : 'var(--th-text)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center my-8">
          <div className="relative flex items-center justify-center w-52 h-52">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="6"
                className="opacity-15"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--th-primary)"
                strokeWidth="6"
                strokeDasharray={276.4}
                strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500"
              />
            </svg>

            {/* Time inside circle */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight">
                {formattedTime}
              </span>
              <span className="text-xs uppercase font-medium mt-1 tracking-widest opacity-60">
                {isActive ? 'In Focus...' : secondsRemaining === 0 ? 'Session Complete!' : 'Paused'}
              </span>
            </div>
          </div>

          {completedCelebration && (
            <div className="mt-2 text-sm font-bold text-emerald-400 animate-bounce">
              🎉 Outstanding focus! Time completed!
            </div>
          )}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleSelectPreset(selectedMinutes)}
            title="Reset timer"
            className="p-3 rounded-2xl transition hover:opacity-80 border"
            style={{
              backgroundColor: 'var(--th-surface-container)',
              borderColor: 'var(--th-border)',
            }}
          >
            🔄
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="px-8 py-3 rounded-2xl font-bold shadow-lg transition flex items-center gap-2 transform active:scale-95"
            style={{
              backgroundColor: isActive ? '#f59e0b' : 'var(--th-primary)',
              color: '#ffffff',
            }}
          >
            <span>{isActive ? '⏸ Pause' : '▶ Start Focus'}</span>
          </button>

          <button
            onClick={playFocusBell}
            title="Test focus chime"
            className="p-3 rounded-2xl transition hover:opacity-80 border"
            style={{
              backgroundColor: 'var(--th-surface-container)',
              borderColor: 'var(--th-border)',
            }}
          >
            🔔
          </button>
        </div>

        {/* Direct Milestone Completion Button */}
        <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--th-border)' }}>
          <div className="text-xs opacity-60 text-center sm:text-left">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd> to toggle,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Esc</kbd> to close.
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting || milestone.isCompleted}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              milestone.isCompleted
                ? 'opacity-50 cursor-not-allowed bg-emerald-600/30 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            <span>{milestone.isCompleted ? '✓ Already Completed' : isCompleting ? 'Saving...' : '✓ Mark Complete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusSessionModal;
