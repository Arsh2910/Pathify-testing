import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
          style={{
            background: 'color-mix(in srgb, var(--th-primary-container) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--th-primary-container) 25%, transparent)',
          }}
        >
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--th-primary-container)' }}>
            explore_off
          </span>
          <span
            style={{
              fontFamily: 'Hanken Grotesk',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--th-primary-container)',
              letterSpacing: '0.08em',
            }}
          >
            404 — ROUTE UNKNOWN
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 42px)',
            color: 'var(--th-on-surface)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '12px',
          }}
        >
          Lost along the trail?
        </h1>

        <p
          style={{
            fontFamily: 'Hanken Grotesk',
            fontSize: '15px',
            color: 'var(--th-on-surface-variant)',
            lineHeight: '22px',
            marginBottom: '32px',
          }}
        >
          The page or roadmap you requested doesn&apos;t exist or may have been archived. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-primary py-2.5 px-6 text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            Dashboard
          </Link>
          <Link
            to="/new"
            className="btn-ghost py-2.5 px-6 text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
