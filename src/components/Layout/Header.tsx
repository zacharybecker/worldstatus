'use client';

export default function Header() {
  return (
    <header className="glass fixed left-0 right-0 top-0 z-40 flex h-[50px] items-center justify-between border-b border-[var(--glass-border)] px-5">
      <h1
        className="neon-text font-mono text-lg font-bold tracking-wider"
        style={{ color: 'var(--accent-cyan)' }}
      >
        WorldStatus.ai
      </h1>
      <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-lg text-[var(--foreground)] opacity-60 transition-opacity hover:opacity-100">
        ⚙️
      </button>
    </header>
  );
}
