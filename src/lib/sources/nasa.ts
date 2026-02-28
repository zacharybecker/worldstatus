import type { EventCategory, WorldEvent } from '@/types/event';

const NASA_EONET_URL =
  'https://eonet.gsfc.nasa.gov/api/v3/events?days=30';

function mapCategory(eonetCategory: string): EventCategory {
  switch (eonetCategory) {
    case 'Wildfires':
      return 'weather';
    case 'Volcanoes':
      return 'earthquake';
    case 'Severe Storms':
      return 'weather';
    case 'Floods':
      return 'weather';
    case 'Sea and Lake Ice':
      return 'weather';
    default:
      return 'weather';
  }
}

function baseSeverity(eonetCategory: string): number {
  if (eonetCategory === 'Volcanoes') return 4;
  return 3;
}

export async function fetchNASAEvents(): Promise<WorldEvent[]> {
  try {
    const res = await fetch(NASA_EONET_URL, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`NASA EONET API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const now = new Date().toISOString();

    return (data.events ?? []).map(
      (event: {
        id: string;
        title: string;
        categories: { title: string }[];
        geometry: { coordinates: number[]; date: string }[];
      }): WorldEvent => {
        const categoryTitle = event.categories?.[0]?.title ?? 'Unknown';
        const latestGeo =
          event.geometry && event.geometry.length > 0
            ? event.geometry[event.geometry.length - 1]
            : null;

        const lng = latestGeo?.coordinates?.[0] ?? 0;
        const lat = latestGeo?.coordinates?.[1] ?? 0;
        const eventTime = latestGeo?.date ?? now;

        return {
          id: crypto.randomUUID(),
          source: 'nasa_eonet',
          sourceId: String(event.id),
          category: mapCategory(categoryTitle),
          severity: baseSeverity(categoryTitle),
          title: event.title ?? 'Unknown event',
          summary: `${categoryTitle} event tracked by NASA EONET`,
          locationName: undefined,
          latitude: lat,
          longitude: lng,
          metadata: {
            eonetCategory: categoryTitle,
            geometryCount: event.geometry?.length ?? 0,
          },
          url: undefined,
          eventTime: new Date(eventTime).toISOString(),
          ingestedAt: now,
        };
      },
    );
  } catch (err) {
    console.error('Failed to fetch NASA EONET events:', err);
    return [];
  }
}
