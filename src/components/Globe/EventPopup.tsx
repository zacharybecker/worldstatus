'use client';

import { useEventStore } from '@/store/eventStore';
import {
  CATEGORY_COLORS,
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

export default function EventPopup() {
  const selectedEvent = useEventStore((s) => s.selectedEvent);
  const setDetailPanelOpen = useEventStore((s) => s.setDetailPanelOpen);

  if (!selectedEvent) return null;

  const categoryColor = CATEGORY_COLORS[selectedEvent.category];
  const severityColor = getSeverityColor(selectedEvent.severity);
  const icon = CATEGORY_ICONS[selectedEvent.category];

  return (
    <div
      className="glass fixed bottom-6 right-6 z-40 w-80 rounded-xl p-4"
      style={{ borderColor: categoryColor, borderWidth: '1px' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">
              {selectedEvent.title}
            </h3>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: `${severityColor}22`,
                color: severityColor,
                border: `1px solid ${severityColor}`,
              }}
            >
              SEV {selectedEvent.severity}
            </span>
            {selectedEvent.locationName && (
              <span className="truncate text-xs text-[var(--foreground)] opacity-60">
                {selectedEvent.locationName}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--foreground)] opacity-50">
              {timeAgo(selectedEvent.eventTime)}
            </span>
            <button
              onClick={() => setDetailPanelOpen(true)}
              className="cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: `${categoryColor}22`,
                color: categoryColor,
                border: `1px solid ${categoryColor}55`,
              }}
            >
              Expand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
