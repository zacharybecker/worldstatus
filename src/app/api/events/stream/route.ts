import { NextRequest } from 'next/server';
import { fetchAllSources } from '@/lib/sources';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const sendHeartbeat = () => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      };

      let lastEventIds = new Set<string>();
      try {
        const initialEvents = await fetchAllSources();
        send('initial', { events: initialEvents, count: initialEvents.length });
        lastEventIds = new Set(initialEvents.map((e) => `${e.source}:${e.sourceId ?? e.id}`));
      } catch (err) {
        console.error('SSE initial fetch error:', err);
        send('error', { message: 'Failed to load initial events' });
      }

      heartbeatInterval = setInterval(sendHeartbeat, 15000);

      pollInterval = setInterval(async () => {
        try {
          const events = await fetchAllSources();
          const currentIds = new Set(events.map((e) => `${e.source}:${e.sourceId ?? e.id}`));
          const newEvents = events.filter((e) => !lastEventIds.has(`${e.source}:${e.sourceId ?? e.id}`));

          if (newEvents.length > 0) {
            send('update', { events: newEvents, count: newEvents.length });
          }

          lastEventIds = currentIds;
        } catch (err) {
          console.error('SSE poll error:', err);
        }
      }, 30000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (pollInterval) clearInterval(pollInterval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
