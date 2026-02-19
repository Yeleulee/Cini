import React, { useState, useEffect } from 'react';
import { Play, Star, Plus, Check } from 'lucide-react';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  index: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, index }) => {
  const [inWatchlist, setInWatchlist] = useState(false);

  // Initialize watchlist state from localStorage
  useEffect(() => {
    try {
      const watchlist = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
      const exists = watchlist.some((m: Movie) => m.id === movie.id);
      setInWatchlist(exists);
    } catch (e) {
      console.error("Failed to read watchlist", e);
    }
  }, [movie.id]);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the player when clicking the plus button
    try {
      const watchlist = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
      let newWatchlist;
      
      if (inWatchlist) {
        newWatchlist = watchlist.filter((m: Movie) => m.id !== movie.id);
      } else {
        newWatchlist = [...watchlist, movie];
      }
      
      localStorage.setItem('cineflow_watchlist', JSON.stringify(newWatchlist));
      setInWatchlist(!inWatchlist);
      
      // Dispatch a custom event to notify App.tsx if it needs to re-filter
      window.dispatchEvent(new Event('watchlistUpdated'));
    } catch (e) {
      console.error("Failed to update watchlist", e);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden cursor-pointer"
      onClick={() => onSelect(movie)}
    >
      {/* Dynamic Glow Effect behind Card */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" />

      {/* Background Image */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
      />

      {/* Gradient Overlay - Always subtle at bottom, grows on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Content Container */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        
        {/* Floating Quick Specs (Top Left) - Only visible on hover */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
             <span className={`self-start px-2 py-0.5 text-[10px] font-bold rounded bg-white/10 backdrop-blur-md border border-white/20 ${movie.quality === '4K' ? 'text-yellow-400' : 'text-white'}`}>
                {movie.quality}
            </span>
             <span className="self-start px-2 py-0.5 text-[10px] font-bold rounded bg-black/60 backdrop-blur-md text-white flex items-center gap-1">
                <Star size={8} className="text-yellow-500 fill-yellow-500" /> {movie.rating}
            </span>
        </div>

        {/* Title & Metadata */}
        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
            <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-lg">{movie.title}</h3>
            <p className="text-zinc-400 text-xs font-medium flex items-center gap-2">
                <span>{movie.year}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span className="truncate max-w-[120px]">{movie.genre[0]}</span>
            </p>
        </div>

        {/* Interactive Buttons - Slide up on hover */}
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
            <button className="flex-1 bg-white text-black h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                <Play size={12} fill="currentColor" /> WATCH NOW
            </button>
             <button 
                onClick={handleToggleWatchlist}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-300 ${
                  inWatchlist 
                    ? 'bg-yellow-500 border-yellow-500 text-black' 
                    : 'bg-black/40 border-white/20 text-white hover:bg-white/10'
                }`}
                title={inWatchlist ? "Remove from List" : "Add to My List"}
             >
                <AnimatePresence mode="wait">
                  {inWatchlist ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0.5, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0.5, rotate: 45 }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0.5, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0.5, rotate: -45 }}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
            </button>
        </div>
      </div>
    </motion.div>
  );
};