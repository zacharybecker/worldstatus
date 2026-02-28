'use client';

import { useEventStore } from '@/store/eventStore';
import { EventCategory } from '@/types/event';

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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str;
}

export default function NewsTicker() {
  const tickerEvents = useEventStore((s) => s.tickerEvents);
  const flyToEvent = useEventStore((s) => s.flyToEvent);

  if (tickerEvents.length === 0) {
    return (
      <div className="glass fixed left-0 right-0 z-30 flex h-10 items-center justify-center border-y border-[var(--glass-border)]" style={{ top: '50px' }}>
        <span className="text-xs text-[var(--foreground)] opacity-40">
          Waiting for events...
        </span>
      </div>
    );
  }

  const renderItems = (prefix: string) => {
    const elements: React.ReactNode[] = [];
    tickerEvents.forEach((event, i) => {
      elements.push(
        <button
          key={`${prefix}-${event.id}`}
          onClick={() => flyToEvent(event)}
          className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-none bg-transparent px-2 py-1 text-xs text-[var(--foreground)] transition-opacity hover:opacity-100 ${
            event.severity >= 4 ? 'breaking-pulse rounded opacity-100' : 'opacity-70'
          }`}
        >
          <span>{CATEGORY_ICONS[event.category]}</span>
          <span>{truncate(event.title, 60)}</span>
          <span className="opacity-40">{timeAgo(event.eventTime)}</span>
        </button>
      );
      if (i < tickerEvents.length - 1) {
        elements.push(
          <span
            key={`${prefix}-div-${i}`}
            className="inline-block px-2 text-xs"
            style={{ color: 'var(--accent-cyan)', opacity: 0.4 }}
          >
            ●
          </span>
        );
      }
    });
    return elements;
  };

  return (
    <div
      className="glass fixed left-0 right-0 z-30 h-10 overflow-hidden border-y border-[var(--glass-border)]"
      style={{ top: '50px' }}
    >
      {/* Gradient fade edges */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12"
        style={{
          background:
            'linear-gradient(to right, var(--background), transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12"
        style={{
          background:
            'linear-gradient(to left, var(--background), transparent)',
        }}
      />

      <div className="ticker-animate flex h-full items-center">
        {renderItems('a')}
        <span
          className="inline-block px-2 text-xs"
          style={{ color: 'var(--accent-cyan)', opacity: 0.4 }}
        >
          ●
        </span>
        {renderItems('b')}
      </div>
    </div>
  );
}
