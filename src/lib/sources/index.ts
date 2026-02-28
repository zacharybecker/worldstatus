import { fetchUSGSEarthquakes } from './usgs';
import { fetchNOAAAlerts } from './noaa';
import { fetchNASAEvents } from './nasa';
import { fetchGDELTEvents } from './gdelt';
import type { WorldEvent } from '@/types/event';

let cachedEvents: WorldEvent[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

function dedup(events: WorldEvent[]): WorldEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.source}:${e.sourceId ?? e.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchAllSources(): Promise<WorldEvent[]> {
  const now = Date.now();
  if (cachedEvents.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedEvents;
  }

  const results = await Promise.allSettled([
    fetchUSGSEarthquakes(),
    fetchNOAAAlerts(),
    fetchNASAEvents(),
    fetchGDELTEvents(),
  ]);

  const allEvents: WorldEvent[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    } else {
      console.error('Source fetch failed:', result.reason);
    }
  }

  const unique = dedup(allEvents);
  unique.sort(
    (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
  );

  cachedEvents = unique;
  cacheTimestamp = now;

  return unique;
}
