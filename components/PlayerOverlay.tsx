import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft, Star, Loader2, AlertTriangle, ChevronDown, PlayCircle, CheckCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { Movie, Season } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerOverlayProps {
    movie: Movie;
    onClose: () => void;
}

type ServerType = 'embed';

interface Server {
    id: string;
    name: string;
    type: ServerType;
    quality: string;
}

const SERVERS: Server[] = [
    { id: 'vidsrc', name: 'Server 1', type: 'embed', quality: '1080p' },
    { id: 'vidlink', name: 'Server 2', type: 'embed', quality: '1080p' },
    { id: 'superembed', name: 'Server 3', type: 'embed', quality: '720p' },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function getEmbedUrl(
    movie: Movie,
    server: Server,
    season: number,
    episode: number
): string {
    const isSeries = movie.type === 'series';
    switch (server.id) {
        case 'vidsrc':
            return isSeries
                ? `https://vidsrc.xyz/embed/tv?imdb=${movie.id}&season=${season}&episode=${episode}`
                : `https://vidsrc.xyz/embed/movie?imdb=${movie.id}`;
        case 'vidlink':
            return isSeries
                ? `https://vidsrc.to/embed/tv/${movie.id}/${season}/${episode}`
                : `https://vidsrc.to/embed/movie/${movie.id}`;
        case 'superembed':
            return isSeries
                ? `https://www.2embed.cc/embedtv/${movie.id}&s=${season}&e=${episode}`
                : `https://www.2embed.cc/embed/${movie.id}`;
        default:
            return `https://vidsrc.xyz/embed/movie?imdb=${movie.id}`;
    }
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface EpisodePanelProps {
    movie: Movie;
    selectedSeason: Season;
    currentEpisodeIndex: number;
    onSeasonChange: (season: Season) => void;
    onEpisodeSelect: (index: number) => void;
}

const EpisodePanel: React.FC<EpisodePanelProps> = ({
    movie,
    selectedSeason,
    currentEpisodeIndex,
    onSeasonChange,
    onEpisodeSelect,
}) => {
    const seasons = movie.seasons ?? [];
    const episodeListRef = useRef<HTMLDivElement>(null);

    // Scroll to active episode when season changes
    useEffect(() => {
        const el = episodeListRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedSeason.id, currentEpisodeIndex]);

    if (seasons.length === 0) return null;

    return (
        <div className="w-full">
            {/* Season tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
                {seasons.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => onSeasonChange(s)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${s.id === selectedSeason.id
                            ? 'bg-yellow-500 text-black border-yellow-500'
                            : 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:border-yellow-500/60 hover:text-white'
                            }`}
                    >
                        Season {s.number}
                    </button>
                ))}
            </div>

            {/* Episode list — explicit height + visible scroll so users know it scrolls */}
            <div
                ref={episodeListRef}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#a16207 #27272a' }}
                className="ep-scroll flex flex-col gap-2 max-h-[420px] md:max-h-[520px] overflow-y-auto pr-2"
            >
                {selectedSeason.episodes.map((ep, idx) => {
                    const isActive = idx === currentEpisodeIndex;
                    return (
                        <button
                            key={ep.id}
                            data-active={isActive}
                            onClick={() => onEpisodeSelect(idx)}
                            className={`group flex items-center gap-3 w-full text-left p-3 md:p-3 rounded-xl border transition-all duration-200 min-h-[60px] ${isActive
                                ? 'bg-yellow-500/10 border-yellow-500/50 text-white'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800/60 active:bg-zinc-800'
                                }`}
                        >
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-zinc-800">
                                <img
                                    src={ep.thumbnailUrl || movie.posterUrl}
                                    alt={ep.title}
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {isActive
                                        ? <CheckCircle size={18} className="text-yellow-500 drop-shadow-lg" />
                                        : <PlayCircle size={18} className="text-white/60 group-hover:text-white transition-colors" />
                                    }
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-yellow-400' : ''}`}>
                                    E{ep.number} — {ep.title}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">{ep.duration}</p>
                            </div>

                            {isActive && (
                                <span className="flex-shrink-0 text-[10px] font-bold text-yellow-500 uppercase tracking-wider pr-1">
                                    ▶ Playing
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── main component ──────────────────────────────────────────────────────────

export const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ movie, onClose }) => {
    const isSeries = movie.type === 'series';
    const hasSeasonsData = isSeries && (movie.seasons?.length ?? 0) > 0;

    const [isPlaying, setIsPlaying] = useState(false);
    const [activeServer, setActiveServer] = useState<Server>(SERVERS[0]);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(
        hasSeasonsData ? movie.seasons![0] : null
    );
    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showEpisodePanel, setShowEpisodePanel] = useState(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Watchlist state — reads from localStorage on mount
    const [inWatchlist, setInWatchlist] = useState(() => {
        try {
            const wl = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
            return wl.some((m: { id: string }) => m.id === movie.id);
        } catch { return false; }
    });

    const handleToggleWatchlist = () => {
        try {
            const wl = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
            const next = inWatchlist
                ? wl.filter((m: { id: string }) => m.id !== movie.id)
                : [...wl, movie];
            localStorage.setItem('cineflow_watchlist', JSON.stringify(next));
            window.dispatchEvent(new Event('storage'));
            setInWatchlist(!inWatchlist);
        } catch { }
    };

    // ── Body scroll lock: prevent page scrolling while overlay is open ──
    useEffect(() => {
        const scrollY = window.scrollY;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
            // Restore exact scroll position (prevents jumping to top on close)
            window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        };
    }, []);

    // ── Loading animation — fires whenever playback is active and something changes ──
    const isPlayingRef = useRef(false);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    useEffect(() => {
        if (!isPlayingRef.current) return;
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 1400);
        return () => clearTimeout(timer);
    }, [activeServer.id, currentEpisodeIndex, selectedSeason?.id, isPlaying]);

    // ── Auto-hide controls on idle (player only) ──
    const showEpisodePanelRef = useRef(showEpisodePanel);
    useEffect(() => { showEpisodePanelRef.current = showEpisodePanel; }, [showEpisodePanel]);

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (!showEpisodePanelRef.current) setShowControls(false);
        }, 3500);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resetControlsTimer);
        window.addEventListener('touchstart', resetControlsTimer);
        resetControlsTimer();
        return () => {
            window.removeEventListener('mousemove', resetControlsTimer);
            window.removeEventListener('touchstart', resetControlsTimer);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [resetControlsTimer]);

    // Keep controls visible while episode panel is open
    useEffect(() => {
        if (showEpisodePanel && controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }, [showEpisodePanel]);

    const handlePlay = () => {
        setIsPlaying(true); // useEffect will fire loading animation
    };

    const handleEpisodeSelect = (index: number) => {
        setCurrentEpisodeIndex(index);
        setIsPlaying(true); // start playing selected episode
        // Auto-close panel on mobile after selection
        if (window.innerWidth < 768) setShowEpisodePanel(false);
    };

    const handleSeasonChange = (season: Season) => {
        setSelectedSeason(season);
        setCurrentEpisodeIndex(0);
    };

    const season = selectedSeason?.number ?? 1;
    const episode = selectedSeason?.episodes[currentEpisodeIndex]?.number ?? 1;
    const currentEp = selectedSeason?.episodes[currentEpisodeIndex];
    const embedUrl = getEmbedUrl(movie, activeServer, season, episode);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#09090b] text-white font-sans"
            style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
            {/* ── Loading Overlay ── */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center"
                    >
                        <div className="text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-serif-display font-bold text-white mb-2"
                            >
                                {movie.title}
                            </motion.h2>
                            {isSeries && currentEp && (
                                <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">
                                    S{season} · E{episode} — {currentEp.title}
                                </p>
                            )}
                            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 uppercase tracking-widest">
                                <Loader2 className="animate-spin" size={12} />
                                <span>Connecting to {activeServer.name}...</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 font-mono mt-4">ID: {movie.id}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header (always visible on info screen; hides in player) ── */}
            <div
                className={`fixed top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-[70] transition-opacity duration-300 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black font-serif-display text-sm">C</div>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full border border-white/10 bg-black/20 hover:bg-white hover:text-black flex items-center justify-center transition-all duration-300 group backdrop-blur-md"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* ── INFO SCREEN (before playback starts) ── */}
            <div className={`relative z-40 min-h-screen flex flex-col transition-opacity duration-500 ${isPlaying ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>

                {/* ── MOBILE HERO POSTER (visible only below lg) ── */}
                <div className="relative lg:hidden w-full h-64 sm:h-80 overflow-hidden flex-shrink-0">
                    {/* Blurred backdrop */}
                    <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-40"
                        aria-hidden="true"
                    />
                    {/* Dark gradient overlay bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
                    {/* Dark gradient overlay top (for nav bar readability) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/60 to-transparent h-24" />

                    {/* Floating centered poster card */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="relative w-48 sm:w-64 aspect-video rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/10"
                        >
                            <img
                                src={movie.backdropUrl || movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Quality badge */}
                            <div className="absolute top-2 left-2">
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500 text-black">
                                    {movie.quality}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ── CONTENT AREA ── */}
                <div className="flex-1 px-5 md:px-14 pb-28 max-w-[1800px] mx-auto w-full pt-4 lg:pt-24">

                    {/* Top pill metadata */}
                    <div className="inline-flex flex-wrap items-center gap-3 p-2 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-5 w-fit">
                        <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] font-bold tracking-widest uppercase">{movie.quality}</span>
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1"><Star size={11} className="text-yellow-500 fill-yellow-500" /> {movie.rating}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        <span className="text-xs font-bold text-zinc-300">{movie.year}</span>
                        {isSeries && <span className="text-xs font-bold text-zinc-400">{movie.seasons?.length ?? 1} Season{(movie.seasons?.length ?? 1) > 1 ? 's' : ''}</span>}
                    </div>

                    <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">

                        {/* Left: title, synopsis, CTA */}
                        <div className="flex-1 max-w-2xl">
                            <h1 className="text-3xl md:text-5xl font-serif-display font-black tracking-tighter leading-tight mb-3 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                                {movie.title}
                            </h1>
                            {movie.tagline && (
                                <p className="text-xs md:text-sm text-zinc-400 font-medium tracking-[0.15em] uppercase mb-5 pl-3 border-l-2 border-yellow-500">
                                    {movie.tagline}
                                </p>
                            )}
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mb-8 font-light">{movie.synopsis}</p>

                            {/* Actions row: Play + Save */}
                            <div className="flex items-center gap-4 mb-10">
                                {/* Play button */}
                                <button
                                    onClick={handlePlay}
                                    className="group relative w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-white hover:scale-105 transition-transform duration-500 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                                >
                                    <div className="absolute inset-0 bg-yellow-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-400" />
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-black ml-1.5 relative z-10">
                                        <path d="M5 3l14 9-14 9V3z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {/* Save to My List */}
                                <button
                                    onClick={handleToggleWatchlist}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-full border font-bold text-sm transition-all duration-300 ${inWatchlist
                                        ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-400 hover:bg-red-500/10 hover:border-red-400/60 hover:text-red-400'
                                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40'
                                        }`}
                                >
                                    {inWatchlist
                                        ? <><BookmarkCheck size={16} /> Saved</>
                                        : <><Bookmark size={16} /> Save to My List</>
                                    }
                                </button>
                            </div>

                            {/* ── EPISODE SELECTOR (info screen) ── */}
                            {hasSeasonsData && selectedSeason && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Episodes</h3>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                            {selectedSeason.episodes.length} Episodes
                                        </span>
                                    </div>
                                    <EpisodePanel
                                        movie={movie}
                                        selectedSeason={selectedSeason}
                                        currentEpisodeIndex={currentEpisodeIndex}
                                        onSeasonChange={handleSeasonChange}
                                        onEpisodeSelect={handleEpisodeSelect}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right: artwork — desktop only */}
                        <div className="hidden lg:flex flex-1 h-[70vh] items-center justify-center pointer-events-none">
                            <motion.img
                                initial={{ opacity: 0, x: 60 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                src={movie.heroUrl || movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* ── ACTIVE PLAYER ── */}
            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black flex flex-col"
                    >
                        <div className="w-full h-full relative">

                            {/* ── Player Top Controls ── */}
                            <div
                                className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                                    }`}
                            >
                                <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-b from-black/90 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => { setIsPlaying(false); setShowEpisodePanel(false); }}
                                            className="text-zinc-300 hover:text-white transition-colors bg-white/5 p-2 rounded-full backdrop-blur-sm"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                        <div>
                                            <h3 className="text-sm font-bold text-white leading-none">{movie.title}</h3>
                                            {isSeries && currentEp && (
                                                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                                                    S{season} · E{episode} — {currentEp.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Episodes toggle (series only) */}
                                        {hasSeasonsData && (
                                            <button
                                                onClick={() => setShowEpisodePanel(p => !p)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${showEpisodePanel
                                                    ? 'bg-yellow-500 text-black border-yellow-500'
                                                    : 'bg-black/40 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white backdrop-blur-md'
                                                    }`}
                                            >
                                                Episodes
                                                <ChevronDown size={12} className={`transition-transform ${showEpisodePanel ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}

                                        {/* Server switcher */}
                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
                                            {SERVERS.map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setActiveServer(s)}
                                                    className={`px-2.5 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${activeServer.id === s.id
                                                        ? 'bg-white text-black shadow'
                                                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all ml-1"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Episode Drawer (in-player, slides down from top) ── */}
                            <AnimatePresence>
                                {showEpisodePanel && hasSeasonsData && selectedSeason && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="absolute top-16 md:top-20 left-0 right-0 z-30 mx-4 md:mx-6 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl max-h-[70vh] overflow-y-auto no-scrollbar"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Episode</h3>
                                            <button
                                                onClick={() => setShowEpisodePanel(false)}
                                                className="text-zinc-500 hover:text-white transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <EpisodePanel
                                            movie={movie}
                                            selectedSeason={selectedSeason}
                                            currentEpisodeIndex={currentEpisodeIndex}
                                            onSeasonChange={handleSeasonChange}
                                            onEpisodeSelect={handleEpisodeSelect}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Embed iframe ── */}
                            <iframe
                                key={`${activeServer.id}-${movie.id}-s${season}e${episode}`}
                                src={embedUrl}
                                className="w-full h-full border-0"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title={`Player - ${movie.title}`}
                            />

                            {/* Tap zone to show controls on mobile */}
                            <div
                                className="absolute inset-0 z-10 md:hidden"
                                onClick={resetControlsTimer}
                                style={{ pointerEvents: showControls ? 'none' : 'auto' }}
                            />

                            {/* Disclaimer */}
                            <div className="absolute bottom-3 right-3 pointer-events-none z-10 opacity-25">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-black/60 px-2 py-1 rounded">
                                    <AlertTriangle size={9} />
                                    <span>Third-party content via {activeServer.id}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};