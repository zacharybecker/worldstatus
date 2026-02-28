import type { WorldEvent } from '@/types/event';

const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

function magnitudeToSeverity(mag: number): number {
  if (mag < 2.5) return 1;
  if (mag < 4.0) return 2;
  if (mag < 5.5) return 3;
  if (mag < 7.0) return 4;
  return 5;
}

export async function fetchUSGSEarthquakes(): Promise<WorldEvent[]> {
  try {
    const res = await fetch(USGS_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`USGS API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const now = new Date().toISOString();

    return (data.features ?? []).map(
      (feature: {
        id: string;
        properties: Record<string, unknown>;
        geometry: { coordinates: number[] };
      }): WorldEvent => {
        const props = feature.properties;
        const mag = (props.mag as number) ?? 0;
        const depth = feature.geometry.coordinates[2] ?? 0;

        return {
          id: `usgs-${feature.id}`,
          source: 'usgs',
          sourceId: String(feature.id),
          category: 'earthquake',
          severity: magnitudeToSeverity(mag),
          title: (props.title as string) ?? 'Unknown earthquake',
          summary: `Magnitude ${mag.toFixed(1)} earthquake at depth of ${depth.toFixed(1)}km`,
          locationName: (props.place as string) ?? undefined,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          metadata: {
            magnitude: mag,
            depth,
            tsunami: props.tsunami,
            felt: props.felt,
          },
          url: (props.url as string) ?? undefined,
          eventTime: new Date(props.time as number).toISOString(),
          ingestedAt: now,
        };
      },
    );
  } catch (err) {
    console.error('Failed to fetch USGS earthquakes:', err);
    return [];
  }
}
