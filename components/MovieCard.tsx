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
    } catch { return []; }
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
    } catch { return false; }
}

// Fallback SVG — zero network dependency
const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect width='400' height='600' fill='%2318181b'/%3E%3Ctext x='200' y='310' text-anchor='middle' font-size='52' fill='%2352525b'%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E";

export const MovieCard: React.FC<MovieCardProps> = ({ movie, index, onSelect }) => {
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isHovered,   setIsHovered]   = useState(false);
    const [imgSrc,      setImgSrc]      = useState(movie.posterUrl);
    const [imgLoaded,   setImgLoaded]   = useState(false);
    const [fallbackStage, setFallbackStage] = useState(0);

    // Reset image when movie changes
    useEffect(() => {
        setImgSrc(movie.posterUrl);
        setImgLoaded(false);
        setFallbackStage(0);
    }, [movie.id, movie.posterUrl]);

    useEffect(() => {
        setInWatchlist(readWatchlistIds().includes(movie.id));
    }, [movie.id]);

    useEffect(() => {
        const sync = () => setInWatchlist(readWatchlistIds().includes(movie.id));
        window.addEventListener('watchlistUpdated', sync);
        return () => window.removeEventListener('watchlistUpdated', sync);
    }, [movie.id]);

    const handleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInWatchlist(toggleWatchlistItem(movie));
    };

    // 3-stage fallback: poster → backdrop → SVG
    const handleImgError = () => {
        if (fallbackStage === 0 && movie.backdropUrl && movie.backdropUrl !== movie.posterUrl) {
            setFallbackStage(1);
            setImgSrc(movie.backdropUrl);
        } else {
            setFallbackStage(2);
            setImgSrc(FALLBACK_POSTER);
            setImgLoaded(true);
        }
    };

    const ratingNum = parseFloat(movie.rating);
    const ratingColor = ratingNum >= 8.0 ? 'text-emerald-400' : ratingNum >= 7.0 ? 'text-yellow-400' : 'text-zinc-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.35 }}
            className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-yellow-500/25 transition-colors duration-300"
            onClick={() => onSelect(movie)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Skeleton shimmer */}
            {!imgLoaded && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/40 via-transparent to-zinc-900/40" />
                </div>
            )}

            {/* Poster image */}
            <img
                src={imgSrc}
                alt={movie.title}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={handleImgError}
                className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-110' : 'scale-100'}`}
            />

            {/* Persistent bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Quality badge — top left (liquid glass) */}
            <div className="absolute top-2.5 left-2.5">
                <span className={`icon-glass text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    movie.quality === '4K' ? 'text-yellow-400 active' : 'text-white'
                }`}>
                    {movie.quality}
                </span>
            </div>

            {/* Watchlist toggle — top right (liquid glass) */}
            <motion.button
                onClick={handleWatchlist}
                whileTap={{ scale: 0.85 }}
                title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full icon-glass flex items-center justify-center z-10 transition-all duration-200 ${
                    inWatchlist ? 'active text-yellow-400 opacity-100' : 'text-white opacity-0 group-hover:opacity-100'
                }`}
            >
                {inWatchlist ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={2.5} />}
            </motion.button>

            {/* Hover play overlay (liquid glass) */}
            <motion.div
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <div className="w-14 h-14 rounded-full icon-glass flex items-center justify-center shadow-xl">
                    <Play size={22} className="text-yellow-400 ml-1" fill="currentColor" />
                </div>
            </motion.div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
                {movie.genre[0] && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
                        {movie.type === 'series' ? '📺 ' : '🎬 '}
                        {movie.genre[0]}
                    </span>
                )}
                <h3 className="text-white font-bold text-sm leading-tight truncate mb-1">{movie.title}</h3>
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
