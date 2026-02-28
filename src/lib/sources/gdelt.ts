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
      }): WorldEvent => {
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

        const name =
          (props.name as string) ??
          (props.url
            ? new URL(props.url as string).hostname
            : 'Unknown event');

        return {
          id: crypto.randomUUID(),
          source: 'gdelt',
          sourceId: (props.urlsocialimage as string) ?? crypto.randomUUID(),
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
          url: (props.url as string) ?? undefined,
          eventTime: now,
          ingestedAt: now,
        };
      },
    );
  } catch (err) {
    console.error('Failed to fetch GDELT events:', err);
    return [];
  }
}
