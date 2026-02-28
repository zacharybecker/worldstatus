'use client';

import { useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';

export default function EventLoader() {
  const setEvents = useEventStore((s) => s.setEvents);
  const setLoading = useEventStore((s) => s.setLoading);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/events');
        if (!res.ok) {
          console.error(`Events API returned ${res.status}`);
          return;
        }
        const data = await res.json();
        if (data.events) {
          setEvents(data.events);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 60000);
    return () => clearInterval(interval);
  }, [setEvents, setLoading]);

  return null;
}
