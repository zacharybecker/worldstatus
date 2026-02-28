import { EventCategory, EventFilter, WorldEvent } from '@/types/event';

export async function fetchEvents(filters?: EventFilter): Promise<WorldEvent[]> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }
    params.set('severityMin', String(filters.severityRange[0]));
    params.set('severityMax', String(filters.severityRange[1]));
    params.set('timeRange', filters.timeRange);
  }

  const query = params.toString();
  const url = `/api/events${query ? `?${query}` : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }

  return res.json();
}

export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getEventIcon(category: EventCategory): string {
  const icons: Record<EventCategory, string> = {
    earthquake: '🌍',
    weather: '🌪️',
    news: '📰',
    conflict: '⚔️',
    financial: '📈',
    cyber: '🔒',
    sports: '🏆',
    space: '🚀',
  };
  return icons[category];
}

export function severityLabel(severity: number): string {
  const labels = ['Low', 'Moderate', 'High', 'Severe', 'Critical'];
  const index = Math.max(0, Math.min(4, Math.round(severity) - 1));
  return labels[index];
}
