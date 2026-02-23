import React from 'react';
import { Home, Search, Film, Tv, User, Zap, Layers } from 'lucide-react';
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
      className="fixed z-50 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500
                 /* Mobile: Bottom Bar */
                 bottom-4 left-4 right-4 h-16 rounded-2xl flex flex-row items-center justify-around px-2
                 /* Desktop: Side Pill */
                 md:bottom-auto md:left-6 md:right-auto md:top-1/2 md:-translate-y-1/2 md:w-20 md:h-auto md:flex-col md:py-8 md:gap-8 md:rounded-full"
    >
      <div className="hidden md:flex mb-2 p-2 bg-yellow-500/10 rounded-full">
        <Zap className="w-6 h-6 text-yellow-500" fill="currentColor" />
      </div>

      <div className="flex flex-row md:flex-col gap-1 md:gap-6 w-full justify-around md:justify-start items-center">
        <NavItem
          icon={<Home size={20} />}
          label="Home"
          active={activeTab === 'HOME'}
          onClick={onHomeClick}
        />
        <NavItem
          icon={<Search size={20} />}
          label="Search"
          onClick={onSearchClick}
        />
        <NavItem
          icon={<Film size={20} />}
          label="Movies"
          active={activeTab === 'MOVIES'}
          onClick={onMoviesClick}
        />
        <NavItem
          icon={<Tv size={20} />}
          label="Series"
          active={activeTab === 'SERIES'}
          onClick={onSeriesClick}
        />
        <NavItem
          icon={<Layers size={20} />}
          label="Collections"
          active={activeTab === 'COLLECTIONS'}
          onClick={onCollectionsClick}
        />
      </div>

      <div className="hidden md:flex mt-4 pt-6 border-t border-white/10">
        <button className="relative group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 p-[1px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {/* Status Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
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
    className="relative group p-3 rounded-full transition-all duration-300 hover:bg-white/10"
  >
    <div className={`transition-colors duration-300 ${active ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
      {icon}
    </div>

    {/* Active Dot - Desktop only */}
    {active && (
      <motion.div
        layoutId="activeNavDot"
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 -mr-1 w-1 h-1 bg-yellow-500 rounded-full"
      />
    )}
    {/* Active Dot - Mobile (Bottom) */}
    {active && (
      <motion.div
        layoutId="activeNavDotMobile"
        className="block md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full"
      />
    )}

    {/* Tooltip - Desktop only */}
    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-xl z-50">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black"></div>
    </div>
  </button>
);