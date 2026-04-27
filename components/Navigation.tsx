import React from 'react';
import { Home, Search, Film, Tv, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationProps {
  onSearchClick: () => void;
  onHomeClick: () => void;
  onMoviesClick?: () => void;
  onSeriesClick?: () => void;
  onCollectionsClick?: () => void;
  activeTab?: 'HOME' | 'MOVIES' | 'SERIES' | 'COLLECTIONS';
}

export const Navigation: React.FC<NavigationProps> = ({
  onSearchClick,
  onHomeClick,
  onMoviesClick,
  onSeriesClick,
  onCollectionsClick,
  activeTab = 'HOME'
}) => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="fixed z-50 transition-all duration-500 bg-transparent pointer-events-auto
                 /* Mobile: Bottom bar */
                 bottom-4 left-4 right-4 h-16 rounded-2xl flex flex-row items-center justify-around px-2
                 /* Desktop: Side pill */
                 md:bottom-auto md:left-6 md:right-auto md:top-1/2 md:-translate-y-1/2 md:w-20 md:h-auto md:flex-col md:py-8 md:gap-6 md:rounded-[2rem]"
    >
      {/* Logo mark — desktop only */}
      <div className="hidden md:flex mb-1 w-10 h-10 rounded-full icon-glass items-center justify-center">
        <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
      </div>

      <div className="flex flex-row md:flex-col gap-1 md:gap-3 w-full justify-around md:justify-start items-center">
        <NavItem icon={<Home    size={20} />} label="Home"        active={activeTab === 'HOME'}        onClick={onHomeClick} />
        <NavItem icon={<Search  size={20} />} label="Search"                                          onClick={onSearchClick} />
        <NavItem icon={<Film    size={20} />} label="Movies"      active={activeTab === 'MOVIES'}      onClick={onMoviesClick} />
        <NavItem icon={<Tv      size={20} />} label="Series"      active={activeTab === 'SERIES'}      onClick={onSeriesClick} />
        <NavItem icon={<Layers  size={20} />} label="Collections" active={activeTab === 'COLLECTIONS'} onClick={onCollectionsClick} />
      </div>

      {/* User avatar — desktop only */}
      <div className="hidden md:flex mt-2 pt-4 border-t border-white/8 w-full justify-center">
        <button className="relative group">
          <div className="w-10 h-10 rounded-full icon-glass p-[2px] flex items-center justify-center overflow-hidden">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User"
              className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 border-2 border-[#09090b] rounded-full" />
        </button>
      </div>
    </motion.nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    data-active={active ? 'true' : undefined}
    className={`relative group w-11 h-11 rounded-full icon-glass flex items-center justify-center transition-all duration-300 ${
      active ? 'active' : ''
    }`}
  >
    {/* Icon */}
    <span className={`transition-colors duration-300 ${active ? 'text-yellow-400' : 'text-zinc-400 group-hover:text-white'}`}>
      {icon}
    </span>

    {/* Active pill — desktop: right edge */}
    {active && (
      <motion.div
        layoutId="activeNavDot"
        className="hidden md:block absolute right-[-6px] top-1/2 -translate-y-1/2 w-1 h-5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]"
      />
    )}

    {/* Active dot — mobile: bottom */}
    {active && (
      <motion.div
        layoutId="activeNavDotMobile"
        className="block md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"
      />
    )}

    {/* Tooltip — desktop hover */}
    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 liquid-panel text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-xl z-50">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(255,255,255,0.08)]" />
    </div>
  </button>
);