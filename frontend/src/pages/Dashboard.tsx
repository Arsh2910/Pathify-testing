import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';
import useAuthStore from '../store/authStore';

import type { Roadmap } from '../store/roadmapStore';

type RoadmapStatus = Roadmap['status'];

const statusCls: Record<RoadmapStatus, string> = {
  generating: 'pill-generating',
  active:     'pill-active',
  completed:  'pill-completed',
  abandoned:  'pill-abandoned',
};

export default function Dashboard() {
  const { roadmaps, fetchRoadmaps, loading, error, deleteRoadmap, abandonRoadmap } = useRoadmapStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RoadmapStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'abandon';
    roadmap: Roadmap | null;
  }>({
    isOpen: false,
    type: 'delete',
    roadmap: null,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoadmaps();
    }
  }, [isAuthenticated, fetchRoadmaps]);

  // Compute status counts
  const counts = useMemo(() => {
    const res = { all: roadmaps.length, active: 0, completed: 0, abandoned: 0, generating: 0 };
    roadmaps.forEach((r) => {
      if (r.status in res) {
        res[r.status as keyof typeof res]++;
      }
    });
    return res;
  }, [roadmaps]);

  // Filter and sort roadmaps
  const filteredRoadmaps = useMemo(() => {
    return roadmaps
      .filter((r) => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesSearch =
          r.goal.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          (r.skillLevel && r.skillLevel.toLowerCase().includes(searchQuery.toLowerCase().trim()));
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.goal.localeCompare(b.goal);
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        // newest (default)
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [roadmaps, statusFilter, searchQuery, sortBy]);

  const handleConfirmAction = async () => {
    if (!confirmModal.roadmap) return;
    const { type, roadmap } = confirmModal;
    try {
      if (type === 'delete') {
        await deleteRoadmap(roadmap._id);
      } else if (type === 'abandon') {
        await abandonRoadmap(roadmap._id);
      }
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || `Failed to ${type} roadmap`);
    } finally {
      setConfirmModal({ isOpen: false, type: 'delete', roadmap: null });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center animate-fade-in max-w-md">
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--th-primary-container)', fontSize: '64px', display: 'block', marginBottom: '20px' }}>
            hub
          </span>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '32px', color: 'var(--th-on-surface)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Welcome to GoalWeave
          </h1>
          <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', color: 'var(--th-on-surface-variant)', marginBottom: '32px' }}>
            Your AI-powered goal & learning roadmap companion. Beat procrastination, one milestone at a time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-ghost">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  const streak = user?.currentStreak || 0;

  return (
    <div className="page-bg min-h-screen pt-24 pb-16 px-4 md:px-12" style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* Hero */}
      <section className="mb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: 'var(--th-primary-container)', letterSpacing: '0.1em', marginBottom: '6px' }}>
              WELCOME BACK
            </p>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--th-on-surface)', letterSpacing: '-0.02em' }}>
              {user?.name || user?.email?.split('@')[0]}
            </h1>
          </div>

          {/* Streak card */}
          <div
            className="flex items-center gap-4 p-5 rounded-xl"
            style={{
              background: 'var(--th-streak-bg)',
              border: '1px solid var(--th-streak-border)',
              minWidth: '190px',
            }}
          >
            <span className="material-symbols-outlined icon-fill animate-float" style={{ color: 'var(--th-streak-color)', fontSize: '40px' }}>
              local_fire_department
            </span>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '32px', color: 'var(--th-streak-color)', lineHeight: 1 }}>
                {streak}
              </p>
              <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 700, color: 'var(--th-streak-color)', letterSpacing: '0.06em', marginTop: '4px', opacity: 0.8 }}>
                DAY STREAK
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA & Controls Toolbar */}
      <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/new" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-base">
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: '20px' }}>add_circle</span>
          New Learning Trail
        </Link>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }}>
            search
          </span>
          <input
            type="text"
            className="input-field pl-11 pr-9"
            style={{ paddingLeft: '2.75rem', paddingRight: '2.25rem' }}
            placeholder="Search roadmaps by goal or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
      </section>

      {/* Status Filter Tabs & Sorter */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'active', 'completed', 'abandoned'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                fontFamily: 'Hanken Grotesk, sans-serif',
                background: statusFilter === st ? 'var(--th-primary-container)' : 'var(--th-surface-container)',
                color: statusFilter === st ? 'var(--th-on-primary)' : 'var(--th-on-surface-variant)',
                border: '1px solid var(--th-outline-variant)',
              }}
            >
              <span>{st}</span>
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px]"
                style={{
                  background: statusFilter === st ? 'rgba(255,255,255,0.25)' : 'var(--th-surface-container-high)',
                }}
              >
                {counts[st]}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--th-on-surface-variant)', fontFamily: 'Hanken Grotesk' }}>
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2.5 py-1 rounded-md text-xs cursor-pointer"
            style={{
              background: 'var(--th-surface-container)',
              color: 'var(--th-on-surface)',
              border: '1px solid var(--th-outline-variant)',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Goal Title (A-Z)</option>
          </select>
        </div>
      </section>

      {/* Roadmaps Grid */}
      <section>
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined animate-spin-glow" style={{ color: 'var(--th-primary-container)', fontSize: '24px' }}>refresh</span>
            <span style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-muted)' }}>Loading your roadmaps…</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl mb-6" style={{ background: 'color-mix(in srgb, var(--th-error-container) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--th-error) 25%, transparent)' }}>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-on-error-container)' }}>{error}</p>
          </div>
        )}

        {!loading && filteredRoadmaps.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: '2px dashed var(--th-outline-variant)', background: 'var(--th-surface-container-low)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--th-outline-variant)', fontSize: '48px', marginBottom: '16px' }}>
              {searchQuery || statusFilter !== 'all' ? 'search_off' : 'map'}
            </span>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '18px', color: 'var(--th-on-surface-variant)', marginBottom: '8px' }}>
              {searchQuery || statusFilter !== 'all' ? 'No matching roadmaps found' : 'No roadmaps yet'}
            </p>
            <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'var(--th-muted)', marginBottom: '24px' }}>
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'Start your first learning trail today.'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="btn-ghost"
              >
                Reset Filters
              </button>
            ) : (
              <Link to="/new" className="btn-primary">
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px' }}>add</span>
                Create Roadmap
              </Link>
            )}
          </div>
        )}

        {!loading && filteredRoadmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoadmaps.map((roadmap, index) => (
              <RoadmapCard
                key={roadmap._id}
                roadmap={roadmap}
                index={index}
                navigate={navigate}
                onRequestDelete={(r) => setConfirmModal({ isOpen: true, type: 'delete', roadmap: r })}
                onRequestAbandon={(r) => setConfirmModal({ isOpen: true, type: 'abandon', roadmap: r })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Styled Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.roadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm p-6 rounded-2xl shadow-2xl"
            style={{
              background: 'var(--th-surface-container)',
              border: '1px solid var(--th-outline-variant)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '28px',
                  color: confirmModal.type === 'delete' ? 'var(--th-error)' : 'var(--th-primary-container)',
                }}
              >
                {confirmModal.type === 'delete' ? 'delete_forever' : 'pause_circle'}
              </span>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--th-on-surface)' }}>
                {confirmModal.type === 'delete' ? 'Delete Roadmap?' : 'Abandon Roadmap?'}
              </h3>
            </div>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-on-surface-variant)' }}
            >
              {confirmModal.type === 'delete'
                ? `Are you sure you want to permanently delete "${confirmModal.roadmap.goal}"? This action cannot be undone.`
                : `Are you sure you want to mark "${confirmModal.roadmap.goal}" as abandoned? You can still view it in the abandoned filter.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: 'delete', roadmap: null })}
                className="btn-ghost py-2 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: confirmModal.type === 'delete' ? 'var(--th-error)' : 'var(--th-primary-container)',
                  color: 'white',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapCard({
  roadmap,
  index,
  navigate,
  onRequestDelete,
  onRequestAbandon,
}: {
  roadmap: Roadmap;
  index: number;
  navigate: (path: string) => void;
  onRequestDelete: (r: Roadmap) => void;
  onRequestAbandon: (r: Roadmap) => void;
}) {
  const isGenerating = roadmap.status === 'generating';
  const isAbandoned  = roadmap.status === 'abandoned';
  const isActive     = roadmap.status === 'active';

  return (
    <div
      className="card group cursor-pointer animate-fade-in"
      style={{
        animationDelay: `${index * 0.05}s`,
        padding: '1.5rem',
        border: isActive ? '1px solid color-mix(in srgb, var(--th-primary-container) 30%, transparent)' : '1px solid var(--th-card-border)',
      }}
      onClick={() => {
        if (isGenerating) navigate(`/roadmaps/${roadmap._id}/loading`);
        else if (!isAbandoned) navigate(`/roadmaps/${roadmap._id}`);
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <span className={statusCls[roadmap.status] || 'pill-active'}>{roadmap.status}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestAbandon(roadmap);
              }}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--th-surface-container)', color: 'var(--th-on-surface-variant)' }}
              title="Abandon"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>pause_circle</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(roadmap);
            }}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ background: 'color-mix(in srgb, var(--th-error) 10%, transparent)', color: 'var(--th-error)' }}
            title="Delete"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
          </button>
        </div>
      </div>

      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: isAbandoned ? 'var(--th-muted)' : 'var(--th-on-surface)', marginBottom: '6px', lineHeight: '22px' }}>
        {roadmap.goal}
      </h3>

      {roadmap.targetTimeframe && (
        <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'var(--th-on-surface-variant)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--th-secondary)' }}>schedule</span>
          {roadmap.targetTimeframe}
        </p>
      )}

      {isGenerating && (
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--th-secondary)', animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'var(--th-secondary)' }}>Generating…</span>
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-1" style={{ color: 'var(--th-primary-container)' }}>
          <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600 }}>View Roadmap</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
        </div>
      )}
    </div>
  );
}
