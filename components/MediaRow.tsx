import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll }) => (
  <div className="flex items-center justify-between px-6 lg:px-16">
    <h2 className="text-xl font-semibold text-white/90 drop-shadow-md">{title}</h2>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="group/label relative flex items-center gap-1 pl-2 text-sm font-medium text-white/50 transition-colors duration-300 hover:text-white"
      >
        View All
        <ChevronRight size={16} className="transition-transform duration-300 group-hover/label:translate-x-0.5" />
      </button>
    )}
  </div>
);

interface ScrollRowProps {
  children: React.ReactNode;
  className?: string;
}

/** Horizontal scroller with hover-revealed arrows (desktop). */
export const ScrollRow: React.FC<ScrollRowProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrow =
    'hidden lg:flex absolute top-1/2 -translate-y-1/2 z-[60] h-12 w-12 items-center justify-center text-white drop-shadow-lg opacity-0 transition-all duration-300 group-hover/row:opacity-100 hover:scale-110 cursor-pointer';

  return (
    <div className="group/row relative">
      <button aria-label="Scroll left" onClick={() => scroll(-1)} className={`${arrow} left-4`}>
        <ChevronLeft size={34} strokeWidth={2.5} />
      </button>
      <div
        ref={ref}
        className={`scrollbar-hide isolate flex items-start gap-4 overflow-x-auto overflow-y-clip px-6 pb-10 pt-4 lg:px-16 ${className}`}
      >
        {children}
      </div>
      <button aria-label="Scroll right" onClick={() => scroll(1)} className={`${arrow} right-4`}>
        <ChevronRight size={34} strokeWidth={2.5} />
      </button>
    </div>
  );
};

interface MediaRowProps {
  title: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

export const MediaRow: React.FC<MediaRowProps> = ({ title, movies, onSelect, onViewAll, loading }) => {
  if (movies.length === 0 && !loading) return null;

  return (
    <section>
      <SectionHeader title={title} onViewAll={movies.length > 0 ? onViewAll : undefined} />
      <ScrollRow className="min-h-[310px] lg:min-h-[356px]">
        {movies.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[140px] flex-none lg:w-[200px]">
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
              </div>
            ))
          : movies.map((movie, i) => (
              <div key={movie.id} className="w-[140px] flex-none lg:w-[200px]">
                <MovieCard movie={movie} index={i} onSelect={onSelect} />
              </div>
            ))}
      </ScrollRow>
    </section>
  );
};
