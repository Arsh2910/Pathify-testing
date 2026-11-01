import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoadmapPolling } from '../hooks/useRoadmapPolling';
import type { Roadmap } from '../store/roadmapStore';
import useRoadmapStore from '../store/roadmapStore';

const loadingMessages = [
  'Analyzing your learning goal…',
  'Structuring progressive learning phases…',
  'Crafting personalized, bite-sized milestones…',
  'Embedding anti-procrastination micro-actions…',
  'Curating verified learning resources…',
  'Finalizing your customized roadmap…',
];

export default function LoadingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRoadmap } = useRoadmapStore();
  const [errorState, setErrorState] = useState<string | null>(null);

  useRoadmapPolling(
    id!,
    (roadmap: Roadmap) => {
      if (roadmap.status === 'active' || roadmap.status === 'completed') {
        navigate(`/roadmaps/${id}`, { replace: true });
      } else if (roadmap.status === 'abandoned') {
        setErrorState('Roadmap generation could not be completed. The AI service timed out or was overloaded.');
      }
    },
    (errMsg: string) => {
      setErrorState(errMsg);
    }
  );

  const isFailed = errorState || currentRoadmap?.status === 'abandoned';

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4 pt-16 pb-12">
      <div className="flex flex-col items-center max-w-lg w-full animate-fade-in">

        {isFailed ? (
          /* Explicit, Graceful Error State */
          <div
            className="w-full card-flat p-8 text-center flex flex-col items-center"
            style={{
              borderColor: 'color-mix(in srgb, var(--th-error) 40%, transparent)',
              background: 'color-mix(in srgb, var(--th-error) 4%, var(--th-surface-container-low))',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{
                background: 'color-mix(in srgb, var(--th-error) 15%, transparent)',
                border: '2px solid color-mix(in srgb, var(--th-error) 30%, transparent)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--th-error)', fontSize: '32px' }}>
                sync_problem
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: '22px',
                color: 'var(--th-on-surface)',
                marginBottom: '10px',
              }}
            >
              Roadmap Creation Paused
            </h1>

            <p
              style={{
                fontFamily: 'Hanken Grotesk',
                fontSize: '14px',
                color: 'var(--th-on-surface-variant)',
                lineHeight: '22px',
                marginBottom: '24px',
              }}
            >
              {errorState || 'Our AI engine was unable to synthesize milestones for this specific topic right now. This usually happens during peak load or network hiccups.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => navigate('/new')}
                className="btn-primary py-2.5 px-6 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Create with New Prompt
              </button>
              <Link
                to="/"
                className="btn-ghost py-2.5 px-6 text-sm flex items-center justify-center gap-2"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Active Loading State */
          <>
            {/* Animated Icon */}
            <div className="relative flex items-center justify-center mb-10">
              {/* Ping ring */}
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: '110px',
                  height: '110px',
                  background: 'color-mix(in srgb, var(--th-primary-container) 8%, transparent)',
                  animationDuration: '2s',
                }}
              />
              {/* Inner circle */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center relative animate-float"
                style={{
                  background: 'color-mix(in srgb, var(--th-primary-container) 12%, var(--th-surface-container-lowest))',
                  border: '2px solid color-mix(in srgb, var(--th-primary-container) 35%, transparent)',
                }}
              >
                {/* Spinning arc */}
                <svg className="animate-spin-glow absolute w-24 h-24" viewBox="0 0 96 96" fill="none">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="var(--th-primary-container)"
                    strokeWidth="2.5"
                    strokeDasharray="40 240"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
                <span
                  className="material-symbols-outlined icon-fill"
                  style={{ color: 'var(--th-primary-container)', fontSize: '36px', zIndex: 1 }}
                >
                  hub
                </span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(22px, 4vw, 30px)',
                color: 'var(--th-on-surface)',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              Weaving your learning roadmap…
            </h1>
            <p
              style={{
                fontFamily: 'Hanken Grotesk',
                fontSize: '15px',
                color: 'var(--th-on-surface-variant)',
                textAlign: 'center',
                marginBottom: '28px',
              }}
            >
              Our AI is tailoring an actionable path with anti-procrastination baby steps.
            </p>

            {/* Pulse dots */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--th-primary-container)',
                    animation: `dot-pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>

            {/* Steps list */}
            <div className="card-flat w-full" style={{ padding: '1.5rem' }}>
              <div className="flex flex-col gap-4">
                {loadingMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{ animation: `fade-in 0.5s ease-out ${i * 0.35}s both` }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'color-mix(in srgb, var(--th-primary-container) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--th-primary-container) 30%, transparent)',
                        animation: `dot-pulse 2s ease-in-out ${i * 0.3}s infinite`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--th-primary-container)', opacity: 0.8 }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'Hanken Grotesk',
                        fontSize: '13px',
                        color: 'var(--th-on-surface-variant)',
                      }}
                    >
                      {msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
