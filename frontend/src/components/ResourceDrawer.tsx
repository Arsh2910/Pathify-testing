import React, { useState, useEffect } from 'react';
import type { Phase } from '../store/roadmapStore';

interface ResourceDrawerProps {
  roadmapId: string;
  phases: Phase[];
}

const typeIcons: Record<string, string> = {
  video: 'play_circle',
  article: 'article',
  course: 'school',
  book: 'menu_book',
  other: 'link',
};

export const ResourceDrawer: React.FC<ResourceDrawerProps> = ({ roadmapId, phases }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'starred' | 'video' | 'article' | 'course'>('all');
  const [starredUrls, setStarredUrls] = useState<string[]>([]);

  const storageKey = `goalweave_stars_${roadmapId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setStarredUrls(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggleStar = (link: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = starredUrls.includes(link)
      ? starredUrls.filter((u) => u !== link)
      : [...starredUrls, link];
    setStarredUrls(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Flatten all resources across all phases and milestones
  const allResources = phases.flatMap((phase) =>
    phase.milestones.flatMap((milestone) =>
      milestone.resources.map((res) => ({
        ...res,
        milestoneTitle: milestone.title,
        phaseTitle: phase.title,
      }))
    )
  );

  const filtered = allResources.filter((res) => {
    if (filter === 'starred') return starredUrls.includes(res.link);
    if (filter === 'all') return true;
    return res.type === filter;
  });

  if (allResources.length === 0) return null;

  return (
    <div
      className="card-flat overflow-hidden transition-all"
      style={{ padding: '1.25rem' }}
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--th-primary-container)', fontSize: '20px' }}
          >
            library_books
          </span>
          <h3
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--th-on-surface)',
            }}
          >
            Resource Hub & References
          </h3>
          <span
            className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
            style={{
              backgroundColor: 'var(--th-surface-container-high)',
              color: 'var(--th-on-surface-variant)',
            }}
          >
            {allResources.length}
          </span>
        </div>

        <span
          className="material-symbols-outlined transition-transform duration-200"
          style={{
            fontSize: '18px',
            color: 'var(--th-on-surface-variant)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-[var(--th-outline-variant)] space-y-3 animate-fade-in">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${allResources.length})` },
              { id: 'starred', label: `⭐ Saved (${starredUrls.length})` },
              { id: 'video', label: 'Videos' },
              { id: 'article', label: 'Docs/Articles' },
              { id: 'course', label: 'Courses' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className="px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer"
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  background:
                    filter === tab.id
                      ? 'color-mix(in srgb, var(--th-primary-container) 15%, transparent)'
                      : 'var(--th-surface-container-high)',
                  color:
                    filter === tab.id ? 'var(--th-primary-container)' : 'var(--th-on-surface-variant)',
                  border: `1px solid ${
                    filter === tab.id ? 'var(--th-primary-container)' : 'var(--th-outline-variant)'
                  }`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resources List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs opacity-60 py-4 text-center">
                {filter === 'starred'
                  ? 'No saved resources yet. Click the star on any resource to bookmark it here!'
                  : 'No resources found in this category.'}
              </p>
            ) : (
              filtered.map((r, i) => {
                const isStarred = starredUrls.includes(r.link);
                return (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-[var(--th-outline-variant)] flex items-start justify-between gap-2.5 transition hover:opacity-90"
                    style={{ background: 'var(--th-surface-container-low)' }}
                  >
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 min-w-0 flex-1 hover:underline"
                    >
                      <span
                        className="material-symbols-outlined mt-0.5"
                        style={{ fontSize: '15px', color: 'var(--th-primary-container)' }}
                      >
                        {typeIcons[r.type] || 'link'}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-semibold truncate leading-snug"
                          style={{
                            fontFamily: 'Hanken Grotesk, sans-serif',
                            color: 'var(--th-on-surface)',
                          }}
                        >
                          {r.title}
                        </p>
                        <p className="text-[10px] opacity-60 truncate">
                          {r.milestoneTitle}
                        </p>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => toggleStar(r.link, e)}
                      title={isStarred ? 'Remove from Saved' : 'Save to Quick References'}
                      className="p-1 rounded cursor-pointer transition hover:scale-110 flex-shrink-0"
                    >
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{
                          fontSize: '16px',
                          color: isStarred ? '#f59e0b' : 'var(--th-outline)',
                        }}
                      >
                        {isStarred ? 'star' : 'star_border'}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDrawer;
