import type { WorldEvent } from '@/types/event';

const NOAA_URL =
  'https://api.weather.gov/alerts/active?status=actual';

function mapSeverity(severity: string): number {
  switch (severity) {
    case 'Extreme':
      return 4;
    case 'Severe':
      return 3;
    case 'Moderate':
      return 2;
    case 'Minor':
    default:
      return 1;
  }
}

export async function fetchNOAAAlerts(): Promise<WorldEvent[]> {
  try {
    const res = await fetch(NOAA_URL, {
      headers: { 'User-Agent': 'WorldStatus.ai (contact@worldstatus.ai)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`NOAA API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const now = new Date().toISOString();

    return (data.features ?? []).slice(0, 50).map(
      (feature: {
        id: string;
        properties: Record<string, unknown>;
        geometry: { type: string; coordinates: number[] | number[][][] } | null;
      }): WorldEvent | null => {
        const props = feature.properties;

        let lat = 0;
        let lng = 0;
        let hasGeometry = false;

        if (feature.geometry && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates;
          if (
            feature.geometry.type === 'Point' &&
            Array.isArray(coords) &&
            typeof coords[0] === 'number'
          ) {
            lng = coords[0] as number;
            lat = coords[1] as number;
            hasGeometry = true;
          } else if (
            feature.geometry.type === 'Polygon' &&
            Array.isArray(coords) &&
            Array.isArray(coords[0])
          ) {
            const ring = coords[0] as number[][];
            if (ring.length > 0) {
              let sumLat = 0;
              let sumLng = 0;
              for (const point of ring) {
                sumLng += point[0];
                sumLat += point[1];
              }
              lng = sumLng / ring.length;
              lat = sumLat / ring.length;
              hasGeometry = true;
            }
          }
        }

        // Skip alerts without any geometry — they can't be placed on the globe
        if (!hasGeometry) return null;

        const description = (props.description as string) ?? '';
        const truncated =
          description.length > 500
            ? description.slice(0, 500) + '...'
            : description;

        return {
          id: `noaa-${feature.id}`,
          source: 'noaa',
          sourceId: String(feature.id),
          category: 'weather',
          severity: mapSeverity((props.severity as string) ?? 'Minor'),
          title:
            (props.headline as string) ??
            (props.event as string) ??
            'Weather Alert',
          summary: truncated,
          locationName: (props.areaDesc as string) ?? undefined,
          latitude: lat,
          longitude: lng,
          metadata: {
            event: props.event,
            urgency: props.urgency,
            certainty: props.certainty,
            senderName: props.senderName,
          },
          url: undefined,
          eventTime: new Date(
            ((props.onset ?? props.effective) as string) ?? now,
          ).toISOString(),
          ingestedAt: now,
        };
      },
    ).filter((e: WorldEvent | null): e is WorldEvent => e !== null);
  } catch (err) {
    console.error('Failed to fetch NOAA alerts:', err);
    return [];
  }
}
