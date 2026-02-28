import Globe from '@/components/Globe/Globe';
import Header from '@/components/Layout/Header';
import NewsTicker from '@/components/Ticker/NewsTicker';
import CategoryFilters from '@/components/Filters/CategoryFilters';
import EventPopup from '@/components/Globe/EventPopup';
import EventDetail from '@/components/Globe/EventDetail';
import EventLoader from '@/components/EventLoader';

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--background)]">
      {/* Invisible data loader */}
      <EventLoader />

      {/* Header at top */}
      <Header />

      {/* News ticker below header */}
      <NewsTicker />

      {/* Globe fills remaining space behind everything */}
      <div className="absolute inset-0 pt-[90px]">
        <Globe />
      </div>

      {/* Category filters on left side */}
      <CategoryFilters />

      {/* Event popup at bottom-right */}
      <EventPopup />

      {/* Slide-in detail panel from right */}
      <EventDetail />
    </div>
  );
}
