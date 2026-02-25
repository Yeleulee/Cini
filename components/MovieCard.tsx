import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
    movie: Movie;
    index: number;
    onSelect: (movie: Movie) => void;
}

const WATCHLIST_KEY = 'cineflow_watchlist';

function readWatchlistIds(): string[] {
    try {
        const wl: Movie[] = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        return wl.map((m) => m.id);
    } catch {
        return [];
    }
}

function toggleWatchlistItem(movie: Movie): boolean {
    try {
        const wl: Movie[] = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        const exists = wl.some((m) => m.id === movie.id);
        const next = exists ? wl.filter((m) => m.id !== movie.id) : [...wl, movie];
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('watchlistUpdated'));
        return !exists;
    } catch {
        return false;
    }
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, index, onSelect }) => {
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setInWatchlist(readWatchlistIds().includes(movie.id));
    }, [movie.id]);

    // Keep in sync if another card updates the watchlist
    useEffect(() => {
        const sync = () => setInWatchlist(readWatchlistIds().includes(movie.id));
        window.addEventListener('watchlistUpdated', sync);
        return () => window.removeEventListener('watchlistUpdated', sync);
    }, [movie.id]);

    const handleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        const added = toggleWatchlistItem(movie);
        setInWatchlist(added);
    };

    const ratingNum = parseFloat(movie.rating);
    const ratingColor =
        ratingNum >= 8.0
            ? 'text-emerald-400'
            : ratingNum >= 7.0
                ? 'text-yellow-400'
                : 'text-zinc-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
            layout
            className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5"
            onClick={() => onSelect(movie)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Poster image */}
            <img
                src={movie.posterUrl}
                alt={movie.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                    }`}
            />

            {/* Persistent gradient at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Quality badge — top left */}
            <div className="absolute top-2.5 left-2.5">
                <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${movie.quality === '4K'
                            ? 'bg-yellow-500/95 text-black'
                            : 'bg-white/20 text-white backdrop-blur-sm'
                        }`}
                >
                    {movie.quality}
                </span>
            </div>

            {/* Watchlist toggle — top right */}
            <motion.button
                onClick={handleWatchlist}
                whileTap={{ scale: 0.85 }}
                title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center z-10 border transition-all duration-200 ${inWatchlist
                        ? 'bg-yellow-500 border-yellow-500 text-black opacity-100'
                        : 'bg-black/60 backdrop-blur border-white/20 text-white opacity-0 group-hover:opacity-100'
                    }`}
            >
                {inWatchlist ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={2.5} />}
            </motion.button>

            {/* Hover overlay — play button */}
            <motion.div
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
                    <Play size={22} className="text-white ml-1" fill="currentColor" />
                </div>
            </motion.div>

            {/* Bottom info — always visible */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Genre pill */}
                {movie.genre[0] && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
                        {movie.type === 'series' ? '📺 ' : '🎬 '}
                        {movie.genre[0]}
                    </span>
                )}

                <h3 className="text-white font-bold text-sm leading-tight truncate mb-1">
                    {movie.title}
                </h3>

                <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-zinc-500">{movie.year}</span>
                    <span className="text-zinc-700">·</span>
                    <Star size={8} className={`${ratingColor} fill-current`} />
                    <span className={`font-bold ${ratingColor}`}>{movie.rating}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-500 truncate">{movie.duration}</span>
                </div>
            </div>
        </motion.div>
    );
};
