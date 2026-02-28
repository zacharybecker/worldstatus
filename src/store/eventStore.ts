import { create } from 'zustand';
import {
  ALL_CATEGORIES,
  EventCategory,
  EventFilter,
  WorldEvent,
} from '@/types/event';

function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([hd])$/);
  if (!match) return 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 60 * 1000;
}

function applyFilters(events: WorldEvent[], filters: EventFilter): WorldEvent[] {
  const now = Date.now();
  const rangeMs = parseTimeRange(filters.timeRange);
  const categorySet = new Set(filters.categories);
  const [minSev, maxSev] = filters.severityRange;

  return events.filter((e) => {
    if (!categorySet.has(e.category)) return false;
    if (e.severity < minSev || e.severity > maxSev) return false;
    const eventMs = new Date(e.eventTime).getTime();
    if (now - eventMs > rangeMs) return false;
    return true;
  });
}

function computeTickerEvents(events: WorldEvent[]): WorldEvent[] {
  return [...events]
    .sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime();
    })
    .slice(0, 20);
}

interface EventStore {
  events: WorldEvent[];
  filteredEvents: WorldEvent[];
  selectedEvent: WorldEvent | null;
  detailPanelOpen: boolean;
  filters: EventFilter;
  isLoading: boolean;
  lastUpdated: string | null;
  tickerEvents: WorldEvent[];
  flyToTarget: { lat: number; lng: number; altitude: number } | null;

  setEvents: (events: WorldEvent[]) => void;
  addEvents: (events: WorldEvent[]) => void;
  setSelectedEvent: (event: WorldEvent | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
  toggleCategory: (category: EventCategory) => void;
  setCategories: (categories: EventCategory[]) => void;
  setSeverityRange: (range: [number, number]) => void;
  setTimeRange: (range: string) => void;
  setLoading: (loading: boolean) => void;
  flyToEvent: (event: WorldEvent) => void;
  clearFlyTarget: () => void;
}

const DEFAULT_FILTERS: EventFilter = {
  categories: [...ALL_CATEGORIES],
  severityRange: [1, 5],
  timeRange: '24h',
};

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  detailPanelOpen: false,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  lastUpdated: null,
  tickerEvents: [],
  flyToTarget: null,

  setEvents: (events) =>
    set((state) => {
      const filteredEvents = applyFilters(events, state.filters);
      return {
        events,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
        lastUpdated: new Date().toISOString(),
      };
    }),

  addEvents: (newEvents) =>
    set((state) => {
      const existingKeys = new Set(state.events.map((e) => `${e.source}:${e.sourceId ?? e.id}`));
      const unique = newEvents.filter((e) => !existingKeys.has(`${e.source}:${e.sourceId ?? e.id}`));
      const events = [...state.events, ...unique];
      const filteredEvents = applyFilters(events, state.filters);
      return {
        events,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
        lastUpdated: new Date().toISOString(),
      };
    }),

  setSelectedEvent: (event) =>
    set({ selectedEvent: event, detailPanelOpen: event !== null }),

  setDetailPanelOpen: (open) =>
    set({ detailPanelOpen: open }),

  toggleCategory: (category) =>
    set((state) => {
      const categories = state.filters.categories.includes(category)
        ? state.filters.categories.filter((c) => c !== category)
        : [...state.filters.categories, category];
      const filters = { ...state.filters, categories };
      const filteredEvents = applyFilters(state.events, filters);
      return {
        filters,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
      };
    }),

  setCategories: (categories) =>
    set((state) => {
      const filters = { ...state.filters, categories };
      const filteredEvents = applyFilters(state.events, filters);
      return {
        filters,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
      };
    }),

  setSeverityRange: (range) =>
    set((state) => {
      const filters = { ...state.filters, severityRange: range };
      const filteredEvents = applyFilters(state.events, filters);
      return {
        filters,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
      };
    }),

  setTimeRange: (range) =>
    set((state) => {
      const filters = { ...state.filters, timeRange: range };
      const filteredEvents = applyFilters(state.events, filters);
      return {
        filters,
        filteredEvents,
        tickerEvents: computeTickerEvents(filteredEvents),
      };
    }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  flyToEvent: (event) =>
    set({
      flyToTarget: {
        lat: event.latitude,
        lng: event.longitude,
        altitude: 1.5,
      },
      selectedEvent: event,
      detailPanelOpen: true,
    }),

  clearFlyTarget: () =>
    set({ flyToTarget: null }),
}));
