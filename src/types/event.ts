export type EventCategory =
  | 'earthquake'
  | 'weather'
  | 'news'
  | 'conflict'
  | 'financial'
  | 'cyber'
  | 'sports'
  | 'space';

export interface WorldEvent {
  id: string;
  source: string;
  sourceId?: string;
  category: EventCategory;
  subcategory?: string;
  severity: number;
  title: string;
  summary?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  url?: string;
  eventTime: string;
  ingestedAt: string;
  dedupHash?: string;
}

export interface EventFilter {
  categories: EventCategory[];
  severityRange: [number, number];
  timeRange: string;
}

export const ALL_CATEGORIES: EventCategory[] = [
  'earthquake',
  'weather',
  'news',
  'conflict',
  'financial',
  'cyber',
  'sports',
  'space',
];

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  earthquake: '#ff3355',
  weather: '#4a90d9',
  news: '#00f0ff',
  conflict: '#ff8800',
  financial: '#00ff88',
  cyber: '#aa44ff',
  sports: '#ffdd00',
  space: '#ffffff',
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  earthquake: 'Earthquake',
  weather: 'Weather',
  news: 'News',
  conflict: 'Conflict',
  financial: 'Financial',
  cyber: 'Cyber',
  sports: 'Sports',
  space: 'Space',
};

export const SEVERITY_COLORS: string[] = [
  '#44cc44',
  '#cccc00',
  '#ff8800',
  '#ff3333',
  '#aa0000',
];

export function getSeverityColor(severity: number): string {
  const index = Math.max(0, Math.min(4, Math.round(severity) - 1));
  return SEVERITY_COLORS[index];
}

export function getCategoryColor(category: EventCategory): string {
  return CATEGORY_COLORS[category];
}
