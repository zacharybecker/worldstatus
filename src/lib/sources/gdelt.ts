import type { EventCategory, WorldEvent } from '@/types/event';

const GDELT_URL =
  'https://api.gdeltproject.org/api/v2/geo/geo?query=world&mode=PointData&format=GeoJSON&timespan=60&maxpoints=100';

export async function fetchGDELTEvents(): Promise<WorldEvent[]> {
  try {
    const res = await fetch(GDELT_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`GDELT API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const now = new Date().toISOString();

    const features = (data.features ?? []).filter(
      (f: { properties: Record<string, unknown>; geometry: { coordinates: number[] } }) =>
        f.geometry.coordinates[0] !== 0 || f.geometry.coordinates[1] !== 0,
    );

    return features.map(
      (feature: {
        properties: Record<string, unknown>;
        geometry: { coordinates: number[] };
      }): WorldEvent | null => {
        try {
          const props = feature.properties;
          const goldstein = props.GoldsteinScale as number | undefined;

          let category: EventCategory = 'news';
          let severity = 2;

          if (goldstein !== undefined && goldstein < -7) {
            category = 'conflict';
            severity = 4;
          } else if (goldstein !== undefined && goldstein < -5) {
            severity = 3;
          }

          let name = (props.name as string) ?? '';
          if (!name && props.url) {
            try {
              name = new URL(props.url as string).hostname;
            } catch {
              name = 'Unknown event';
            }
          }
          if (!name) name = 'Unknown event';

          const urlStr = (props.url as string) ?? '';
          const sourceId = urlStr || `${feature.geometry.coordinates[1]}_${feature.geometry.coordinates[0]}_${name}`;

          return {
            id: `gdelt-${sourceId}`,
            source: 'gdelt',
            sourceId,
            category,
            severity,
            title: name,
            summary: undefined,
            locationName: undefined,
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            metadata: {
              goldsteinScale: goldstein,
              domain: props.domain,
              sharingimage: props.urlsocialimage,
            },
            url: urlStr || undefined,
            eventTime: now,
            ingestedAt: now,
          };
        } catch (err) {
          console.error('Failed to parse GDELT event:', err);
          return null;
        }
      },
    ).filter((e: WorldEvent | null): e is WorldEvent => e !== null);
  } catch (err) {
    console.error('Failed to fetch GDELT events:', err);
    return [];
  }
}
