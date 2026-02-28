import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources } from '@/lib/sources';
import type { EventCategory } from '@/types/event';

function parseSince(since: string): number {
  const now = Date.now();
  const match = since.match(/^(\d+)(h|d)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'h') return now - value * 60 * 60 * 1000;
  if (unit === 'd') return now - value * 24 * 60 * 60 * 1000;
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const categoriesParam = searchParams.get('categories');
    const severityMin = parseInt(searchParams.get('severityMin') ?? searchParams.get('severity_min') ?? '1', 10);
    const severityMax = parseInt(searchParams.get('severityMax') ?? searchParams.get('severity_max') ?? '5', 10);
    const sinceParam = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') ?? '500', 10);

    let events = await fetchAllSources();

    if (categoriesParam) {
      const categories = categoriesParam.split(',') as EventCategory[];
      events = events.filter((e) => categories.includes(e.category));
    }

    events = events.filter(
      (e) => e.severity >= severityMin && e.severity <= severityMax,
    );

    if (sinceParam) {
      const sinceTimestamp = parseSince(sinceParam);
      if (sinceTimestamp > 0) {
        events = events.filter(
          (e) => new Date(e.eventTime).getTime() >= sinceTimestamp,
        );
      }
    }

    events = events.slice(0, limit);

    return NextResponse.json(
      { events, count: events.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      },
    );
  } catch (err) {
    console.error('Events API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}
