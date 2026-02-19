import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Signal, Wifi, Star, Loader2, Maximize, Settings, AlertTriangle } from 'lucide-react';
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

// FIX: Replaced "Direct" demo server with real embed alternatives
const SERVERS: Server[] = [
    { id: 'vidsrc', name: 'Server 1 (Primary)', type: 'embed', quality: '1080p' },
    { id: 'vidlink', name: 'Server 2 (Backup)', type: 'embed', quality: '1080p' },
    { id: 'superembed', name: 'Server 3 (Fast)', type: 'embed', quality: '720p' },
];

export const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ movie, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeServer, setActiveServer] = useState<Server>(SERVERS[0]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(
    movie.seasons ? movie.seasons[0] : null
  );
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  // --- Sync Logger & Initialization ---
  useEffect(() => {
    // Sync Logger to verify ID matching
    console.log(`[Player Sync] Initializing Stream for ID: ${movie.id}`);
    console.log(`[Player Sync] Metadata Title: ${movie.title}`);
    console.log(`[Player Sync] Active Server: ${activeServer.name} (${activeServer.id})`);
    
    setIsLoading(true);
    // Short artificial delay to show the "Brush Stroke" transition for aesthetic purposes
    const timer = setTimeout(() => {
        setIsLoading(false);
        setIsPlaying(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [movie.id, activeServer.id]);

  useEffect(() => {
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(true);
  };

  // --- URL Generator Strategy ---
  const getEmbedUrl = () => {
      const isSeries = movie.type === 'series';
      const season = selectedSeason?.number || 1;
      const episode = selectedSeason?.episodes[currentEpisodeIndex]?.number || 1;

      // Dynamic URL generation based on provider
      switch (activeServer.id) {
          case 'vidsrc':
              return isSeries 
                  ? `https://vidsrc.xyz/embed/tv?imdb=${movie.id}&season=${season}&episode=${episode}`
                  : `https://vidsrc.xyz/embed/movie?imdb=${movie.id}`;
          case 'vidlink':
               return isSeries
                  ? `https://vidsrc.to/embed/tv/${movie.id}/${season}/${episode}`
                  : `https://vidsrc.to/embed/movie/${movie.id}`;
          case 'superembed':
               // Fallback provider
               return isSeries 
                  ? `https://www.2embed.cc/embedtv/${movie.id}&s=${season}&e=${episode}`
                  : `https://www.2embed.cc/embed/${movie.id}`;
          default:
               return `https://vidsrc.xyz/embed/movie?imdb=${movie.id}`;
      }
  };

  // --- Render ---

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#09090b] text-white overflow-y-auto font-sans no-scrollbar"
    >
      {/* --- Loading Transition (Brush Stroke) --- */}
      <AnimatePresence>
        {isLoading && (
            <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center"
            >
                <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                     {/* Brush Mask Animation */}
                     <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 bg-yellow-500 brush-mask origin-left opacity-20"
                     />
                     <div className="z-10 text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-serif-display font-bold text-white mb-2"
                        >
                            {movie.title}
                        </motion.h2>
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 uppercase tracking-widest">
                            <Loader2 className="animate-spin" size={12} />
                            <span>Connecting to {activeServer.name}...</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-mono mt-4">ID: {movie.id}</p>
                     </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Dynamic Background --- */}
      {!isPlaying && !isLoading && (
          <>
            <div 
                className="fixed inset-0 bg-cover bg-center opacity-40 blur-3xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${movie.backdropUrl})` }}
            />
            <div className="fixed inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
          </>
      )}

      {/* --- Header --- */}
      <div className={`fixed top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-[70] transition-transform duration-500 ${isPlaying && !showControls ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex items-center gap-3">
            {!isPlaying ? (
                <>
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black font-serif-display">C</div>
                    <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase hidden md:block">CineFlow Ultra</span>
                </>
            ) : (
                <button onClick={() => setIsPlaying(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                    <ArrowLeft size={20} /> <span className="text-xs font-bold tracking-widest uppercase">Exit Player</span>
                </button>
            )}
        </div>
        <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-full border border-white/10 bg-black/20 hover:bg-white hover:text-black flex items-center justify-center transition-all duration-300 group backdrop-blur-md"
        >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* --- Main Layout (Info Screen) --- */}
      <div className={`relative z-40 min-h-screen flex flex-col pt-32 pb-20 px-6 md:px-16 max-w-[1800px] mx-auto transition-opacity duration-500 ${isPlaying ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 lg:gap-0 min-h-[60vh]">
            <div className="flex-1 max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-4 p-2 pr-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                     <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] font-bold tracking-widest uppercase">{movie.quality}</span>
                     <span className="text-xs font-bold text-zinc-300 flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {movie.rating}</span>
                     <span className="w-1 h-1 rounded-full bg-zinc-600" />
                     <span className="text-xs font-bold text-zinc-300">{movie.year}</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-serif-display font-black tracking-tighter leading-[0.8] mb-6 text-white mix-blend-overlay">{movie.title}</h1>
                <p className="text-2xl md:text-3xl text-zinc-400 font-light tracking-[0.2em] uppercase mb-10 pl-2 border-l-4 border-yellow-500">{movie.tagline}</p>
                <p className="text-zinc-300 text-lg leading-relaxed max-w-xl mb-12 font-light">{movie.synopsis}</p>
                
                <div className="flex items-center gap-10">
                    <button 
                        onClick={handlePlay}
                        className="group relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center bg-white hover:scale-105 transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                    >
                        <div className="absolute inset-0 border-[3px] border-black/10 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-yellow-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-black ml-2 relative z-10">
                             <path d="M5 3l14 9-14 9V3z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="absolute -bottom-10 text-[10px] font-bold tracking-[0.2em] text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">Start Stream</span>
                    </button>
                </div>
            </div>

            {/* Artwork */}
            <div className="flex-1 h-[60vh] lg:h-[80vh] relative flex items-center justify-center z-0 pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
                >
                     <img 
                        src={movie.heroUrl || movie.posterUrl} 
                        alt="Character" 
                        className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    />
                </motion.div>
            </div>
        </div>
      </div>

      {/* --- ACTIVE PLAYER ENGINE --- */}
      <AnimatePresence>
        {isPlaying && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black flex flex-col"
            >
                <div className="w-full h-full relative bg-black">
                    
                    {/* Floating Controls Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/90 to-transparent z-20 flex items-center justify-between px-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsPlaying(false)} className="text-zinc-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full backdrop-blur-sm">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-none">{movie.title}</h3>
                                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">{activeServer.name}</span>
                                </div>
                            </div>
                            
                            {/* Server Switcher */}
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
                                {SERVERS.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => setActiveServer(s)}
                                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                                            activeServer.id === s.id 
                                            ? 'bg-white text-black shadow-lg' 
                                            : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                    </div>
                    
                    {/* The Embed Player */}
                    <iframe 
                        key={`${activeServer.id}-${movie.id}`} // Force re-render on server/movie change
                        src={getEmbedUrl()}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={`Player - ${movie.title}`}
                    />

                    {/* Disclaimer Overlay (Fade out) */}
                    <div className="absolute bottom-4 right-4 pointer-events-none z-10 opacity-30">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-black/60 px-2 py-1 rounded">
                            <AlertTriangle size={10} />
                            <span>Third-party content provided by {activeServer.id}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};