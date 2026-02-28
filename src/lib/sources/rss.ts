import type { WorldEvent } from '@/types/event';

const RSS_FEEDS = [
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    name: 'NYT World',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    name: 'BBC World',
  },
];

const COUNTRY_COORDS: Record<string, [number, number]> = {
  ukraine: [48.38, 31.17],
  russia: [55.75, 37.62],
  china: [39.9, 116.4],
  iran: [35.69, 51.39],
  israel: [31.77, 35.22],
  gaza: [31.35, 34.31],
  palestine: [31.9, 35.2],
  syria: [33.51, 36.29],
  turkey: [39.93, 32.85],
  india: [28.61, 77.21],
  japan: [35.68, 139.69],
  korea: [37.57, 126.98],
  mexico: [19.43, -99.13],
  brazil: [-15.79, -47.88],
  nigeria: [9.06, 7.49],
  egypt: [30.04, 31.24],
  germany: [52.52, 13.4],
  france: [48.86, 2.35],
  london: [51.51, -0.13],
  paris: [48.86, 2.35],
  washington: [38.91, -77.04],
  'new york': [40.71, -74.01],
  beijing: [39.9, 116.4],
  moscow: [55.76, 37.62],
  tokyo: [35.68, 139.69],
  africa: [0, 25],
  europe: [50, 10],
  asia: [35, 105],
  'middle east': [29, 41],
  cuba: [21.52, -77.78],
  afghanistan: [34.53, 69.17],
  iraq: [33.31, 44.37],
  pakistan: [33.69, 73.04],
  yemen: [15.35, 44.21],
  sudan: [15.59, 32.53],
  myanmar: [19.76, 96.07],
  ethiopia: [9.02, 38.75],
  somalia: [2.05, 45.32],
  libya: [32.9, 13.18],
  lebanon: [33.89, 35.5],
  taiwan: [25.03, 121.57],
  australia: [-33.87, 151.21],
  canada: [45.42, -75.7],
  'united kingdom': [51.51, -0.13],
  'south korea': [37.57, 126.98],
  'north korea': [39.02, 125.75],
  'saudi arabia': [24.71, 46.68],
  indonesia: [-6.21, 106.85],
  philippines: [14.6, 120.98],
  vietnam: [21.03, 105.85],
  thailand: [13.76, 100.5],
  colombia: [4.71, -74.07],
  argentina: [-34.6, -58.38],
  chile: [-33.45, -70.67],
  venezuela: [10.49, -66.88],
  peru: [-12.05, -77.04],
  spain: [40.42, -3.7],
  italy: [41.9, 12.5],
  poland: [52.23, 21.01],
  greece: [37.98, 23.73],
};

function extractLocation(title: string): [number, number] | null {
  const lower = title.toLowerCase();
  for (const [keyword, coords] of Object.entries(COUNTRY_COORDS)) {
    if (lower.includes(keyword)) return coords;
  }
  return null;
}

function extractSeverity(title: string): number {
  const lower = title.toLowerCase();
  if (
    lower.includes('dead') ||
    lower.includes('killed') ||
    lower.includes('war') ||
    lower.includes('attack') ||
    lower.includes('bomb')
  )
    return 4;
  if (
    lower.includes('crisis') ||
    lower.includes('conflict') ||
    lower.includes('protest') ||
    lower.includes('threat')
  )
    return 3;
  return 2;
}

function extractCategory(title: string): 'news' | 'conflict' {
  const lower = title.toLowerCase();
  if (
    lower.includes('war') ||
    lower.includes('attack') ||
    lower.includes('bomb') ||
    lower.includes('military') ||
    lower.includes('killed') ||
    lower.includes('troops') ||
    lower.includes('strike') ||
    lower.includes('conflict')
  )
    return 'conflict';
  return 'news';
}

function parseRSSItems(
  xml: string,
): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title =
      content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      content.match(/<title>(.*?)<\/title>/)?.[1] ??
      '';
    const link = content.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
    const description =
      content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ??
      content.match(/<description>(.*?)<\/description>/)?.[1] ??
      '';

    if (title) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").replace(/&quot;/g, '"'),
        link,
        pubDate,
        description: description.replace(/<[^>]*>/g, '').slice(0, 300),
      });
    }
  }
  return items;
}

export async function fetchRSSNews(): Promise<WorldEvent[]> {
  const allEvents: WorldEvent[] = [];
  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      const xml = await res.text();
      const items = parseRSSItems(xml).slice(0, 25);

      return items
        .map((item): WorldEvent | null => {
          const coords = extractLocation(item.title);
          if (!coords) return null;

          return {
            id: crypto.randomUUID(),
            source: feed.name.toLowerCase().replace(/\s+/g, '_'),
            sourceId: item.link,
            category: extractCategory(item.title),
            severity: extractSeverity(item.title),
            title: item.title,
            summary: item.description || undefined,
            locationName: undefined,
            latitude: coords[0],
            longitude: coords[1],
            metadata: { feedName: feed.name },
            url: item.link,
            eventTime: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : now,
            ingestedAt: now,
          };
        })
        .filter((e): e is WorldEvent => e !== null);
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    }
  }

  return allEvents;
}
