import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useRoadmapStore from '../store/roadmapStore';
import { useTheme } from '../hooks/useTheme';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { roadmaps, fetchRoadmaps } = useRoadmapStore();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      if (roadmaps.length === 0) fetchRoadmaps();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Standard commands
  const staticActions = [
    {
      id: 'action-new',
      title: 'Create New Learning Trail',
      subtitle: 'Generate a tailored roadmap with AI',
      icon: 'add_circle',
      category: 'Actions',
      onSelect: () => navigate('/new'),
    },
    {
      id: 'action-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View all active & completed roadmaps',
      icon: 'dashboard',
      category: 'Navigation',
      onSelect: () => navigate('/dashboard'),
    },
    {
      id: 'action-theme',
      title: `Switch to ${isDark ? 'Light' : 'Dark'} Theme`,
      subtitle: isDark ? 'Luminous Forest' : 'Electric Emerald',
      icon: isDark ? 'light_mode' : 'dark_mode',
      category: 'Preferences',
      onSelect: () => toggleTheme(),
    },
  ];

  // Roadmap search results
  const roadmapItems = roadmaps.map((r) => ({
    id: `roadmap-${r._id}`,
    title: r.goal,
    subtitle: `${r.skillLevel} · ${r.targetTimeframe} · ${r.status}`,
    icon: 'route',
    category: 'My Roadmaps',
    onSelect: () => navigate(`/roadmap/${r._id}`),
  }));

  const allItems = [...staticActions, ...roadmapItems];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Handle Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden animate-scale-in"
        style={{
          background: 'var(--th-surface-container)',
          borderColor: 'var(--th-outline-variant)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--th-outline-variant)' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--th-primary-container)', fontSize: '22px' }}
          >
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search roadmaps..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium"
            style={{
              fontFamily: 'Hanken Grotesk, sans-serif',
              color: 'var(--th-on-surface)',
            }}
          />
          <kbd
            className="px-2 py-0.5 rounded text-[11px] font-mono opacity-60 border"
            style={{
              borderColor: 'var(--th-outline-variant)',
              backgroundColor: 'var(--th-surface-container-high)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs opacity-60">
              No roadmaps or commands match "{search}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className="px-4 py-2.5 mx-2 rounded-xl flex items-center justify-between cursor-pointer transition"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--th-primary-container) 15%, transparent)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid color-mix(in srgb, var(--th-primary-container) 25%, transparent)'
                      : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '18px',
                        color: isSelected
                          ? 'var(--th-primary-container)'
                          : 'var(--th-on-surface-variant)',
                      }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{
                          fontFamily: 'Manrope, sans-serif',
                          color: 'var(--th-on-surface)',
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-[11px] truncate opacity-70"
                        style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ml-2 opacity-50 flex-shrink-0"
                    style={{ backgroundColor: 'var(--th-surface-container-high)' }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          className="px-4 py-2 text-[11px] opacity-60 flex items-center justify-between border-t border-[var(--th-outline-variant)]"
          style={{ background: 'var(--th-surface-container-low)' }}
        >
          <span>GoalWeave Quick Palette</span>
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
