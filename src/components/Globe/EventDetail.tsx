'use client';

import { useEventStore } from '@/store/eventStore';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EventCategory,
  getSeverityColor,
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

export default function EventDetail() {
  const selectedEvent = useEventStore((s) => s.selectedEvent);
  const detailPanelOpen = useEventStore((s) => s.detailPanelOpen);
  const setDetailPanelOpen = useEventStore((s) => s.setDetailPanelOpen);
  const setSelectedEvent = useEventStore((s) => s.setSelectedEvent);

  const isOpen = detailPanelOpen && selectedEvent !== null;
  const categoryColor = selectedEvent
    ? CATEGORY_COLORS[selectedEvent.category]
    : 'var(--accent-cyan)';

  const handleClose = () => {
    setDetailPanelOpen(false);
    setSelectedEvent(null);
  };

  const handleShare = async () => {
    if (!selectedEvent) return;
    const url = `${window.location.origin}/?event=${selectedEvent.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback: ignore
    }
  };

  return (
    <div
      className="glass fixed right-0 z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out"
      style={{
        top: '90px',
        bottom: 0,
        width: '400px',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        borderLeft: `2px solid ${categoryColor}`,
      }}
    >
      {selectedEvent && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {CATEGORY_ICONS[selectedEvent.category]}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: categoryColor }}
              >
                {CATEGORY_LABELS[selectedEvent.category]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="cursor-pointer rounded-md px-2 py-1 text-xs text-[var(--foreground)] opacity-60 transition-opacity hover:opacity-100"
                title="Copy permalink"
              >
                Share
              </button>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-sm text-[var(--foreground)] opacity-60 transition-opacity hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-lg font-bold text-[var(--foreground)]">
              {selectedEvent.title}
            </h2>

            {/* Severity badge */}
            <div className="mb-4 flex items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${getSeverityColor(selectedEvent.severity)}22`,
                  color: getSeverityColor(selectedEvent.severity),
                  border: `1px solid ${getSeverityColor(selectedEvent.severity)}`,
                }}
              >
                Severity {selectedEvent.severity}/5
              </span>
              <span className="text-xs text-[var(--foreground)] opacity-50">
                {timeAgo(selectedEvent.eventTime)}
              </span>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                AI Summary
              </h4>
              <p className="text-sm leading-relaxed text-[var(--foreground)] opacity-80">
                {selectedEvent.summary || 'No summary available.'}
              </p>
            </div>

            {/* Location */}
            {selectedEvent.locationName && (
              <div className="mb-4">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  Location
                </h4>
                <p className="text-sm text-[var(--foreground)] opacity-80">
                  {selectedEvent.locationName}
                </p>
                <p className="text-xs text-[var(--foreground)] opacity-40">
                  {selectedEvent.latitude.toFixed(4)},{' '}
                  {selectedEvent.longitude.toFixed(4)}
                </p>
              </div>
            )}

            {/* Event Time */}
            <div className="mb-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                Event Time
              </h4>
              <p className="text-sm text-[var(--foreground)] opacity-80">
                {formatTime(selectedEvent.eventTime)}
              </p>
            </div>

            {/* Source */}
            {selectedEvent.url && (
              <div className="mb-4">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  Source
                </h4>
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline transition-opacity hover:opacity-80"
                  style={{ color: categoryColor }}
                >
                  {selectedEvent.source} ↗
                </a>
              </div>
            )}

            {/* Tags */}
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-xs text-[var(--foreground)] opacity-60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
