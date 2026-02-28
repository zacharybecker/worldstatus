'use client';

import { useEventStore } from '@/store/eventStore';
import {
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EventCategory,
} from '@/types/event';

const CATEGORY_ICONS: Record<EventCategory, string> = {
  earthquake: '🔴',
  weather: '🌪️',
  news: '📰',
  conflict: '⚔️',
  financial: '📈',
  cyber: '🔒',
  sports: '⚽',
  space: '🚀',
};

export default function CategoryFilters() {
  const filters = useEventStore((s) => s.filters);
  const toggleCategory = useEventStore((s) => s.toggleCategory);
  const setCategories = useEventStore((s) => s.setCategories);
  const setSeverityRange = useEventStore((s) => s.setSeverityRange);

  const allActive = filters.categories.length === ALL_CATEGORIES.length;

  const handleToggleAll = () => {
    if (allActive) {
      setCategories([]);
    } else {
      setCategories([...ALL_CATEGORIES]);
    }
  };

  return (
    <div
      className="glass fixed left-4 z-30 flex w-40 flex-col gap-1 rounded-xl p-3"
      style={{ top: '50%', transform: 'translateY(-50%)' }}
    >
      {/* All toggle */}
      <button
        onClick={handleToggleAll}
        className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg border-none px-2 py-1.5 text-left text-xs font-semibold transition-all ${
          allActive
            ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
            : 'bg-transparent text-[var(--foreground)] opacity-40'
        }`}
      >
        <span className="text-sm">{allActive ? '◉' : '○'}</span>
        <span>All</span>
        <span className="ml-auto text-[10px] opacity-50">
          {filters.categories.length}/{ALL_CATEGORIES.length}
        </span>
      </button>

      <div className="mb-1 border-b border-[var(--glass-border)]" />

      {/* Category buttons */}
      {ALL_CATEGORIES.map((cat) => {
        const active = filters.categories.includes(cat);
        const color = CATEGORY_COLORS[cat];
        return (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border-none px-2 py-1.5 text-left text-xs transition-all ${
              active ? 'opacity-100' : 'bg-transparent opacity-30'
            }`}
            style={
              active
                ? {
                    backgroundColor: `${color}15`,
                    color: color,
                    boxShadow: `0 0 8px ${color}33`,
                  }
                : { color: 'var(--foreground)' }
            }
          >
            <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
            <span className="font-medium">{CATEGORY_LABELS[cat]}</span>
          </button>
        );
      })}

      <div className="mt-1 border-b border-[var(--glass-border)]" />

      {/* Severity range */}
      <div className="mt-1 px-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
            Severity
          </span>
          <span className="text-[10px] text-[var(--foreground)] opacity-50">
            {filters.severityRange[0]}-{filters.severityRange[1]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={5}
            value={filters.severityRange[0]}
            onChange={(e) =>
              setSeverityRange([
                Math.min(Number(e.target.value), filters.severityRange[1]),
                filters.severityRange[1],
              ])
            }
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--glass-border)] accent-[var(--accent-cyan)]"
          />
          <input
            type="range"
            min={1}
            max={5}
            value={filters.severityRange[1]}
            onChange={(e) =>
              setSeverityRange([
                filters.severityRange[0],
                Math.max(Number(e.target.value), filters.severityRange[0]),
              ])
            }
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--glass-border)] accent-[var(--accent-cyan)]"
          />
        </div>
      </div>
    </div>
  );
}
