import React from 'react';
import { Home, Film, Tv, Bookmark, Search, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

type TabId = 'HOME' | 'MOVIES' | 'SERIES' | 'COLLECTIONS';

interface NavigationProps {
  onSearchClick: () => void;
  onHomeClick: () => void;
  onMoviesClick?: () => void;
  onSeriesClick?: () => void;
  onCollectionsClick?: () => void;
  activeTab?: TabId;
}

const ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'HOME',        label: 'Home',    icon: Home },
  { id: 'MOVIES',      label: 'Movies',  icon: Film },
  { id: 'SERIES',      label: 'Shows',   icon: Tv },
  { id: 'COLLECTIONS', label: 'My List', icon: Bookmark },
];

const pillSpring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.8 };

export const Navigation: React.FC<NavigationProps> = ({
  onSearchClick,
  onHomeClick,
  onMoviesClick,
  onSeriesClick,
  onCollectionsClick,
  activeTab = 'HOME',
}) => {
  const handlers: Record<TabId, (() => void) | undefined> = {
    HOME: onHomeClick,
    MOVIES: onMoviesClick,
    SERIES: onSeriesClick,
    COLLECTIONS: onCollectionsClick,
  };

  return (
    <>
      {/* ── Top header: logo left, glass pill right (desktop) ─────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 lg:py-6 pointer-events-none"
      >
        <button
          onClick={onHomeClick}
          aria-label="Home"
          className="pointer-events-auto flex items-center gap-2.5 text-white drop-shadow-md active:scale-95 transition-transform"
        >
          <img
            src="/logo.png"
            alt=""
            className="h-11 w-11 object-contain select-none"
            draggable={false}
          />
          <span className="text-xl font-semibold tracking-tight">Cini</span>
        </button>

        <nav
          role="tablist"
          className="hidden lg:flex glass-header relative items-center gap-1 rounded-full p-[6px] pointer-events-auto"
        >
          {ITEMS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={handlers[id]}
                className={`relative z-10 flex h-10 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                  active ? 'text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={pillSpring}
                    className="nav-pill absolute inset-0 -z-10 rounded-full bg-white"
                  />
                )}
                {active && <Icon size={16} strokeWidth={2.25} />}
                {label}
              </button>
            );
          })}

          <span className="mx-1 h-5 w-px bg-white/10" />

          <button
            onClick={onSearchClick}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
          >
            <Search size={18} />
          </button>
          <button
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
          >
            <Settings size={18} />
          </button>
        </nav>

        {/* Mobile: search shortcut top-right */}
        <button
          onClick={onSearchClick}
          aria-label="Search"
          className="lg:hidden pointer-events-auto glass-header flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-95 transition-transform"
        >
          <Search size={18} />
        </button>
      </motion.header>

      {/* ── Mobile bottom glass bar ──────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="lg:hidden fixed bottom-4 inset-x-4 z-50 glass-header flex items-center rounded-full p-[6px]"
      >
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              onClick={handlers[id]}
              aria-label={label}
              className={`relative z-10 flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors duration-300 ${
                active ? 'text-black' : 'text-white/60'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill-mobile"
                  transition={pillSpring}
                  className="nav-pill absolute inset-0 -z-10 rounded-full bg-white"
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </motion.nav>
    </>
  );
};
