import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoadmapPolling } from '../hooks/useRoadmapPolling';
import useRoadmapStore from '../store/roadmapStore';

const loadingMessages = [
  'Analysing your learning goal…',
  'Charting the most efficient path…',
  'Crafting personalized milestones…',
  'Adding anti-procrastination techniques…',
  'Building your learning trail…',
  'Finalising your roadmap…',
];

export default function LoadingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRoadmap } = useRoadmapStore();

  useRoadmapPolling(id, (roadmap) => {
    if (roadmap.status === 'active' || roadmap.status === 'completed') {
      navigate(`/roadmaps/${id}`, { replace: true });
    } else if (roadmap.status === 'abandoned') {
      navigate('/', { replace: true });
    }
  });

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center max-w-lg w-full">

        {/* Animated Icon */}
        <div className="relative flex items-center justify-center mb-10">
          {/* Ping ring */}
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: '110px', height: '110px',
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
              <circle cx="48" cy="48" r="44"
                stroke="var(--th-primary-container)" strokeWidth="2.5"
                strokeDasharray="40 240" strokeLinecap="round" opacity="0.7" />
            </svg>
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)', fontSize: '36px', zIndex: 1 }}>
              hiking
            </span>
          </div>
        </div>

        {/* Text */}
        <h1 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 700,
          fontSize: 'clamp(22px, 4vw, 30px)', color: 'var(--th-on-surface)',
          letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '10px',
        }}>
          Building your learning trail…
        </h1>
        <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', color: 'var(--th-on-surface-variant)', textAlign: 'center', marginBottom: '28px' }}>
          Our AI is crafting a personalized path just for you. This takes a moment.
        </p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--th-primary-container)', animation: `dot-pulse 1.4s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>

        {/* Steps list */}
        <div className="card-flat w-full" style={{ padding: '1.5rem' }}>
          <div className="flex flex-col gap-4">
            {loadingMessages.map((msg, i) => (
              <div key={i} className="flex items-center gap-3"
                style={{ animation: `fade-in 0.5s ease-out ${i * 0.35}s both` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--th-primary-container) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--th-primary-container) 30%, transparent)',
                    animation: `dot-pulse 2s ease-in-out ${i * 0.3}s infinite`,
                  }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--th-primary-container)', opacity: 0.8 }} />
                </div>
                <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)' }}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Abandoned / failed state */}
        {currentRoadmap?.status === 'abandoned' && (
          <div
            className="mt-8 p-4 rounded-xl text-center w-full"
            style={{ background: 'color-mix(in srgb, var(--th-error-container) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--th-error) 25%, transparent)' }}
          >
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-on-error-container)', marginBottom: '12px' }}>
              Roadmap generation failed. Please try again.
            </p>
            <button onClick={() => navigate('/new')} className="btn-ghost py-2 px-5 text-sm">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
