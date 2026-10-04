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

export function readWatchlistIds(): string[] {
    try {
        const wl: Movie[] = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        return wl.map((m) => m.id);
    } catch { return []; }
}

export function toggleWatchlistItem(movie: Movie): boolean {
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
const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect width='400' height='600' fill='%2317171b'/%3E%3Ctext x='200' y='310' text-anchor='middle' font-size='52' fill='%23444'%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E";

export const MovieCard: React.FC<MovieCardProps> = ({ movie, index, onSelect }) => {
    const [inWatchlist, setInWatchlist] = useState(false);
    const [imgSrc,      setImgSrc]      = useState(movie.posterUrl);
    const [imgLoaded,   setImgLoaded]   = useState(false);
    const [fallbackStage, setFallbackStage] = useState(0);

    useEffect(() => {
        setImgSrc(movie.posterUrl);
        setImgLoaded(false);
        setFallbackStage(0);
    }, [movie.id, movie.posterUrl]);

    useEffect(() => {
        const sync = () => setInWatchlist(readWatchlistIds().includes(movie.id));
        sync();
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            onClick={() => onSelect(movie)}
            className="group/card block w-full origin-center cursor-pointer transition-transform duration-500 ease-out lg:hover:scale-105 hover:z-50"
        >
            <div className="relative isolate aspect-[2/3] overflow-hidden rounded-xl bg-white/5 shadow-xl shadow-black/40">
                {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}

                <img
                    src={imgSrc}
                    alt={movie.title}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    onError={handleImgError}
                    className={`block h-full w-full object-cover transition-all duration-300 lg:group-hover/card:brightness-50 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Watchlist toggle */}
                <button
                    onClick={handleWatchlist}
                    aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                    className={`glass-header absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white transition-all duration-300 active:scale-90 ${
                        inWatchlist ? 'opacity-100' : 'opacity-0 lg:group-hover/card:opacity-100'
                    }`}
                >
                    {inWatchlist ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                </button>

                {/* Hover overlay — desktop only */}
                <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center p-4 text-center opacity-0 translate-y-4 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                        <Play size={20} fill="currentColor" className="ml-0.5 text-white" />
                    </span>
                    <h3 className="text-sm font-bold leading-tight text-white line-clamp-2 drop-shadow-md">{movie.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-white/80">
                        <span>{movie.year}</span>
                        <span className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-400" fill="currentColor" />
                            {movie.rating}
                        </span>
                    </div>
                </div>
            </div>

            {/* Caption — mobile only */}
            <div className="mt-2 px-0.5 lg:hidden">
                <p className="text-sm font-semibold text-white line-clamp-1">{movie.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-white/60">
                    <span>{movie.year}</span>
                    <span>·</span>
                    <Star size={10} className="text-yellow-400" fill="currentColor" />
                    <span>{movie.rating}</span>
                </p>
            </div>
        </motion.div>
    );
};
