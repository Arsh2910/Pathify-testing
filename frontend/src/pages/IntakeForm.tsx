import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';

const timeframeOptions = [
  { value: '1 week',   label: '1 Week' },
  { value: '2 weeks',  label: '2 Weeks' },
  { value: '1 month',  label: '1 Month' },
  { value: '3 months', label: '3 Months' },
  { value: '6 months', label: '6 Months' },
];

interface Blueprint {
  id: string;
  goal: string;
  timeframe: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hoursPerDay: number;
  category: string;
  icon: string;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'web-dev',
    goal: 'Full-Stack Web Development with React & Node.js',
    timeframe: '3 months',
    skillLevel: 'beginner',
    hoursPerDay: 2,
    category: 'Web Dev',
    icon: 'code',
  },
  {
    id: 'ai-ml',
    goal: 'Python Data Science & Machine Learning Foundations',
    timeframe: '3 months',
    skillLevel: 'beginner',
    hoursPerDay: 2,
    category: 'AI / Data',
    icon: 'psychology',
  },
  {
    id: 'system-design',
    goal: 'System Design & Scalable Cloud Architecture',
    timeframe: '1 month',
    skillLevel: 'intermediate',
    hoursPerDay: 1.5,
    category: 'Architecture',
    icon: 'schema',
  },
  {
    id: 'devops',
    goal: 'DevOps Essentials: Docker, Kubernetes & CI/CD Pipelines',
    timeframe: '1 month',
    skillLevel: 'intermediate',
    hoursPerDay: 1.5,
    category: 'DevOps',
    icon: 'cloud_sync',
  },
  {
    id: 'mobile',
    goal: 'Cross-Platform Mobile App Development with React Native',
    timeframe: '3 months',
    skillLevel: 'intermediate',
    hoursPerDay: 2,
    category: 'Mobile',
    icon: 'smartphone',
  },
  {
    id: 'dsa',
    goal: 'Data Structures & Algorithms Technical Interview Prep',
    timeframe: '1 month',
    skillLevel: 'intermediate',
    hoursPerDay: 2,
    category: 'Algorithms',
    icon: 'terminal',
  },
];

export default function IntakeForm() {
  const navigate = useNavigate();
  const { createRoadmap } = useRoadmapStore();

  const [goal, setGoal] = useState('');
  const [targetTimeframe, setTargetTimeframe] = useState('1 month');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectBlueprint = (b: Blueprint) => {
    setSelectedBlueprint(b.id);
    setGoal(b.goal);
    setTargetTimeframe(b.timeframe);
    setSkillLevel(b.skillLevel);
    setHoursPerDay(b.hoursPerDay);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedGoal = goal.trim();
    if (!trimmedGoal || trimmedGoal.length < 3) {
      setError('Please provide a learning goal with at least 3 characters (not just spaces).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const roadmap = await createRoadmap({
        goal: trimmedGoal,
        targetTimeframe,
        skillLevel,
        hoursPerDay,
      });
      navigate(`/roadmaps/${roadmap._id}/loading`);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create roadmap. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page-bg min-h-screen px-4 pt-24 pb-16 flex items-start justify-center">
      <div className="w-full max-w-2xl animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: 'color-mix(in srgb, var(--th-primary-container) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--th-primary-container) 25%, transparent)',
            }}
          >
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)', fontSize: '18px' }}>
              hub
            </span>
            <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.1em' }}>
              NEW LEARNING ROADMAP
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700,
            fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--th-on-surface)',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px',
          }}>
            What do you want to learn?
          </h1>
          <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', color: 'var(--th-on-surface-variant)', lineHeight: '22px' }}>
            Break the cycle of procrastination with a personalized, AI-crafted learning path.
          </p>
        </div>

        {/* Curated Trail Blueprints */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.08em' }}>
              POPULAR TRAIL BLUEPRINTS
            </span>
            <span className="text-[11px] opacity-60">1-click auto-config</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BLUEPRINTS.map((b) => {
              const isSelected = selectedBlueprint === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBlueprint(b)}
                  className="p-3 rounded-xl border cursor-pointer transition hover:scale-[1.01]"
                  style={{
                    background: isSelected
                      ? 'color-mix(in srgb, var(--th-primary-container) 12%, var(--th-surface-container-low))'
                      : 'var(--th-surface-container-low)',
                    borderColor: isSelected
                      ? 'var(--th-primary-container)'
                      : 'var(--th-outline-variant)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '18px',
                          color: isSelected ? 'var(--th-primary-container)' : 'var(--th-muted)',
                        }}
                      >
                        {b.icon}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 opacity-70">
                        {b.category}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-xs text-emerald-500" style={{ fontSize: '16px' }}>
                        check_circle
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs font-semibold mt-1.5 line-clamp-1"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--th-on-surface)' }}
                  >
                    {b.goal}
                  </p>
                  <p className="text-[10px] opacity-60 mt-0.5">
                    {b.timeframe} · {b.hoursPerDay}h/day · {b.skillLevel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="card-flat" style={{ padding: '2.5rem' }}>
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-6"
              style={{ background: 'color-mix(in srgb, var(--th-error-container) 50%, transparent)', border: '1px solid color-mix(in srgb, var(--th-error) 25%, transparent)' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--th-error)', fontSize: '18px' }}>error</span>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-error-container)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Goal */}
            <div>
              <label className="block mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-on-surface-variant)', letterSpacing: '0.08em' }}>
                LEARNING GOAL
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Learn conversational Spanish, Master React, Build ML models"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required minLength={3} maxLength={100}
              />
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 mr-1">Inspiration:</span>
                {[
                  'Master React & Next.js',
                  'Learn Python for AI/ML',
                  'System Design & Microservices',
                  'Docker & Kubernetes',
                  'Conversational Spanish',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGoal(s)}
                    className="px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer"
                    style={{
                      background: 'var(--th-surface-container)',
                      color: 'var(--th-on-surface-variant)',
                      border: '1px solid var(--th-outline-variant)',
                      fontFamily: 'Hanken Grotesk',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-muted)', marginTop: '8px' }}>
                Be specific — the more detail, the better your roadmap.
              </p>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block mb-3" style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-on-surface-variant)', letterSpacing: '0.08em' }}>
                TARGET TIMEFRAME
              </label>
              <div className="flex flex-wrap gap-2">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetTimeframe(opt.value)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      fontFamily: 'Hanken Grotesk',
                      fontWeight: 600,
                      background: targetTimeframe === opt.value
                        ? 'color-mix(in srgb, var(--th-primary-container) 15%, transparent)'
                        : 'var(--th-surface-container)',
                      color: targetTimeframe === opt.value ? 'var(--th-primary-container)' : 'var(--th-on-surface-variant)',
                      border: `1px solid ${targetTimeframe === opt.value ? 'color-mix(in srgb, var(--th-primary-container) 40%, transparent)' : 'var(--th-outline-variant)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill + Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-on-surface-variant)', letterSpacing: '0.08em' }}>
                  SKILL LEVEL
                </label>
                <div className="flex flex-col gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        background: skillLevel === level
                          ? 'color-mix(in srgb, var(--th-primary-container) 10%, transparent)'
                          : 'var(--th-surface-container)',
                        border: `1px solid ${skillLevel === level
                          ? 'color-mix(in srgb, var(--th-primary-container) 30%, transparent)'
                          : 'var(--th-outline-variant)'}`,
                      }}
                    >
                      <input
                        type="radio" name="skillLevel" value={level}
                        checked={skillLevel === level} onChange={() => setSkillLevel(level)}
                        style={{ accentColor: 'var(--th-primary-container)' }}
                      />
                      <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: skillLevel === level ? 'var(--th-primary-container)' : 'var(--th-on-surface-variant)', textTransform: 'capitalize' }}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-on-surface-variant)', letterSpacing: '0.08em' }}>
                  HOURS PER DAY
                </label>
                <input
                  type="number" className="input-field"
                  min="0.5" max="24" step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  required
                />
                <div
                  className="flex items-center gap-2 mt-4 p-3 rounded-lg"
                  style={{ background: 'var(--th-surface-container)' }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--th-tertiary-container)', fontSize: '18px' }}>
                    tips_and_updates
                  </span>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-on-surface-variant)' }}>
                    Even 30 min/day builds lasting habits.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}>
              {loading ? (
                <><span className="material-symbols-outlined animate-spin-glow" style={{ fontSize: '20px' }}>refresh</span> Weaving your roadmap...</>
              ) : (
                <><span className="material-symbols-outlined icon-fill" style={{ fontSize: '20px' }}>auto_awesome</span> Weave My Learning Roadmap</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
