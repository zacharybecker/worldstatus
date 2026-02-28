'use client';
import dynamic from 'next/dynamic';

const GlobeScene = dynamic(() => import('./GlobeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-accent-cyan animate-pulse">Loading Globe...</div>
    </div>
  ),
});

export default function Globe() {
  return <GlobeScene />;
}
