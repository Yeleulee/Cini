import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Movie } from '../types';
import { readWatchlistIds, toggleWatchlistItem } from './MovieCard';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const SLIDE_COUNT = 7;
const AUTO_ADVANCE_MS = 7000;
const ease = [0.25, 1, 0.5, 1] as const;

export const Hero: React.FC<HeroProps> = ({ movies, onPlay }) => {
  const slides = movies.slice(0, SLIDE_COUNT);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inList, setInList] = useState(false);
  const [bgFailed, setBgFailed] = useState<Record<string, boolean>>({});
  // Current + previous backdrop ids; previous fades out under the current one
  const [bgLayers, setBgLayers] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();

  const safeIdx = Math.min(idx, Math.max(slides.length - 1, 0));
  const movie = slides[safeIdx];
  const movieId = movie?.id;

  useEffect(() => {
    if (!movieId) return;
    setBgLayers(prev => [...prev.filter(id => id !== movieId).slice(-1), movieId]);
  }, [movieId]);

  useEffect(() => {
    if (slides.length <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [slides.length, paused, reduceMotion]);

  useEffect(() => {
    if (!movie) return;
    const sync = () => setInList(readWatchlistIds().includes(movie.id));
    sync();
    window.addEventListener('watchlistUpdated', sync);
    return () => window.removeEventListener('watchlistUpdated', sync);
  }, [movie?.id]);

  if (!movie) return null;

  const backdropFor = (m: Movie) =>
    bgFailed[m.id] ? m.posterUrl : m.backdropUrl || m.heroUrl || m.posterUrl;

  const layerMovies = bgLayers
    .map(id => (id === movie.id ? movie : movies.find(m => m.id === id)))
    .filter((m): m is Movie => !!m);
  if (!layerMovies.some(m => m.id === movie.id)) layerMovies.push(movie);

  return (
    <section
      className="relative h-[88vh] min-h-[560px] w-full overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrop crossfade — stacked layers keyed by id, so rapid slide changes can't strand a stale image */}
      {layerMovies.map(m => {
        const active = m.id === movie.id;
        return (
          <motion.img
            key={`${m.id}-${bgFailed[m.id] ? 'p' : 'b'}`}
            src={backdropFor(m)}
            alt={m.title}
            onError={() => setBgFailed(p => ({ ...p, [m.id]: true }))}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 1.02 }}
            transition={{ duration: 0.9, ease }}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        );
      })}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-[#050505]/70 via-transparent to-transparent lg:block" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-36 text-center lg:items-start lg:px-16 lg:pb-24 lg:text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
            transition={{ duration: 0.55, ease }}
            className="flex w-full max-w-2xl flex-col items-center gap-4 lg:items-start"
          >
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg lg:text-5xl">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm font-medium text-white drop-shadow-md lg:justify-start lg:gap-3 lg:text-base">
              <span className="flex items-center gap-1.5">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                {movie.rating}/10
              </span>
              <span className="text-white/60">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-white/80" />
                {movie.year}
              </span>
              {movie.genre[0] && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="flex items-center gap-1.5">
                    <Tag size={16} className="text-white/80" />
                    {movie.genre[0]}
                  </span>
                </>
              )}
            </div>

            <div className="hidden lg:block">
              <p className="max-w-xl text-base font-medium text-white drop-shadow-md line-clamp-3 lg:text-lg">
                {movie.synopsis}
              </p>
            </div>

            <div className="mt-2 flex w-full items-center justify-center gap-3 lg:justify-start">
              <button
                onClick={() => onPlay(movie)}
                className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#f2f2f2] px-6 text-lg font-semibold tracking-wide text-black shadow-xl shadow-black/30 transition-all duration-200 hover:bg-white active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                Play
              </button>

              <div className="glass-header flex h-[52px] items-center rounded-full px-1.5">
                <button
                  onClick={() => setInList(toggleWatchlistItem(movie))}
                  aria-label={inList ? 'Remove from list' : 'Add to list'}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 active:scale-90"
                >
                  {inList ? <Check size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.25} />}
                </button>
                <span className="h-6 w-px bg-white/15" />
                <button
                  onClick={() => onPlay(movie)}
                  aria-label="More Info"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 active:scale-90"
                >
                  <Info size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-28 z-10 flex items-center justify-center gap-2 lg:inset-x-auto lg:bottom-10 lg:right-16">
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full shadow-lg transition-[width,background-color] duration-300 ${
                i === safeIdx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
