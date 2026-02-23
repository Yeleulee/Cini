import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkX, Star, PlayCircle, Trash2, SlidersHorizontal, Film, Tv } from 'lucide-react';

interface CollectionsViewProps {
    onSelectMovie: (movie: Movie) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const WATCHLIST_KEY = 'cineflow_watchlist';

function readWatchlist(): Movie[] {
    try {
        return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    } catch {
        return [];
    }
}

function persistWatchlist(list: Movie[]) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('watchlistUpdated'));
}

type FilterType = 'all' | 'movie' | 'series';

// ─── component ───────────────────────────────────────────────────────────────

export const CollectionsView: React.FC<CollectionsViewProps> = ({ onSelectMovie }) => {
    const [watchlist, setWatchlist] = useState<Movie[]>(readWatchlist);
    const [filter, setFilter] = useState<FilterType>('all');

    // Sync when MovieCard or PlayerOverlay toggles the watchlist
    useEffect(() => {
        const sync = () => setWatchlist(readWatchlist());
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = watchlist.filter(m => m.id !== id);
        setWatchlist(next);
        persistWatchlist(next);
    }, [watchlist]);

    const handleClearAll = () => {
        persistWatchlist([]);
        setWatchlist([]);
    };

    const displayed = filter === 'all'
        ? watchlist
        : watchlist.filter(m => m.type === filter);

    const moviesCount = watchlist.filter(m => m.type === 'movie').length;
    const seriesCount = watchlist.filter(m => m.type === 'series').length;

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-20 pb-32 overflow-x-hidden">

            {/* ── Page Header ── */}
            <div className="px-6 md:px-20 pt-8 mb-10">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-yellow-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-2"
                >
                    Your Personal Library
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
                >
                    <div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-none">
                            My Collection
                        </h1>
                        {watchlist.length > 0 && (
                            <p className="text-zinc-500 text-sm mt-2">
                                {watchlist.length} title{watchlist.length !== 1 ? 's' : ''} saved
                                {moviesCount > 0 && seriesCount > 0 && (
                                    <span className="ml-2 text-zinc-600">
                                        · {moviesCount} film{moviesCount !== 1 ? 's' : ''} · {seriesCount} series
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {watchlist.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="self-start sm:self-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-400/40 px-4 py-2.5 rounded-full"
                        >
                            <Trash2 size={11} />
                            Clear All
                        </button>
                    )}
                </motion.div>

                {/* Filter tabs — only show if there are both movies and series */}
                {moviesCount > 0 && seriesCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2 mt-8"
                    >
                        <SlidersHorizontal size={13} className="text-zinc-600 mr-1" />
                        {([
                            { key: 'all', label: `All (${watchlist.length})` },
                            { key: 'movie', label: `Films (${moviesCount})` },
                            { key: 'series', label: `Series (${seriesCount})` },
                        ] as { key: FilterType; label: string }[]).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filter === f.key
                                        ? 'bg-yellow-500 text-black border-yellow-500'
                                        : 'text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* ── Divider ── */}
            <div className="mx-6 md:mx-20 h-px bg-zinc-900 mb-10" />

            {/* ── Content ── */}
            <div className="px-6 md:px-20">
                {watchlist.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-28 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/40 text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 0.6 }}
                            className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8"
                        >
                            <Bookmark size={36} className="text-zinc-600" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">Nothing saved yet</h2>
                        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-8">
                            Browse the library and tap the{' '}
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-zinc-600 text-white text-xs font-bold align-middle mx-0.5">+</span>
                            {' '}button on any title to add it here — then come back to watch it anytime.
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                            <Film size={12} />
                            <span>Movies &amp; Series welcome</span>
                            <Tv size={12} />
                        </div>
                    </motion.div>
                ) : displayed.length === 0 ? (
                    /* Filter empty state */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <p className="text-zinc-600 text-sm">No {filter === 'movie' ? 'films' : 'series'} saved yet.</p>
                        <button onClick={() => setFilter('all')} className="mt-3 text-yellow-500 text-xs font-bold hover:underline">
                            Show all saved titles
                        </button>
                    </motion.div>
                ) : (
                    /* Watchlist Grid */
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
                    >
                        <AnimatePresence mode="popLayout">
                            {displayed.map((movie, index) => (
                                <motion.div
                                    key={movie.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.82, transition: { duration: 0.18 } }}
                                    transition={{ delay: Math.min(index * 0.04, 0.28), duration: 0.35 }}
                                    className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-zinc-900"
                                    onClick={() => onSelectMovie(movie)}
                                >
                                    {/* Poster */}
                                    <img
                                        src={movie.posterUrl}
                                        alt={movie.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500"
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    />

                                    {/* Dark overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/10 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Type badge — top left */}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${movie.type === 'series'
                                                ? 'bg-purple-600/90 text-white'
                                                : 'bg-yellow-500/95 text-black'
                                            }`}>
                                            {movie.type === 'series' ? 'Series' : 'Film'}
                                        </span>
                                    </div>

                                    {/* Remove button — top right */}
                                    <button
                                        onClick={(e) => handleRemove(e, movie.id)}
                                        title="Remove from collection"
                                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80 hover:border-red-400 z-10 text-white"
                                    >
                                        <BookmarkX size={12} />
                                    </button>

                                    {/* Bottom info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-white font-bold text-sm leading-tight truncate mb-0.5">
                                            {movie.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2.5">
                                            <span>{movie.year}</span>
                                            <span className="opacity-40">·</span>
                                            <Star size={7} className="text-yellow-500 fill-yellow-500" />
                                            <span>{movie.rating}</span>
                                        </div>

                                        {/* Watch button */}
                                        <button className="w-full bg-white text-black rounded-xl py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 hover:bg-yellow-400">
                                            <PlayCircle size={12} />
                                            Watch Now
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
