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
        const data = await res.json();
        setEvents(data.events ?? data);
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
