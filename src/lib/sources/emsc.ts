import type { WorldEvent } from '@/types/event';

const EMSC_URL =
  'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=50&orderby=time';

function magnitudeToSeverity(mag: number): number {
  if (mag < 2.5) return 1;
  if (mag < 4.0) return 2;
  if (mag < 5.5) return 3;
  if (mag < 7.0) return 4;
  return 5;
}

export async function fetchEMSCEarthquakes(): Promise<WorldEvent[]> {
  try {
    const res = await fetch(EMSC_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error(`EMSC API returned ${res.status}`);
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
          id: crypto.randomUUID(),
          source: 'emsc',
          sourceId: String(props.source_id ?? feature.id),
          category: 'earthquake',
          severity: magnitudeToSeverity(mag),
          title: `M${mag.toFixed(1)} - ${(props.flynn_region as string) ?? 'Unknown'}`,
          summary: `Magnitude ${mag.toFixed(1)} earthquake at depth of ${depth.toFixed(1)}km`,
          locationName: (props.flynn_region as string) ?? undefined,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          metadata: {
            magnitude: mag,
            depth,
            author: props.auth,
          },
          url: (props.unid as string)
            ? `https://www.seismicportal.eu/eventdetail.html?unid=${props.unid}`
            : undefined,
          eventTime: new Date(props.time as string).toISOString(),
          ingestedAt: now,
        };
      },
    );
  } catch (err) {
    console.error('Failed to fetch EMSC earthquakes:', err);
    return [];
  }
}
