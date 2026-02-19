import React, { useState } from 'react';
import { Collection, Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Clock, User, Shuffle, ChevronLeft, Film } from 'lucide-react';

interface CollectionsViewProps {
  collections: Collection[];
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ collections, allMovies, onSelectMovie }) => {
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  // Helper to get movies for a collection
  const getCollectionMovies = (col: Collection) => {
    return col.movieIds.map(id => allMovies.find(m => m.id === id)).filter(Boolean) as Movie[];
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-20 px-6 md:px-0 overflow-x-hidden">
      
      <AnimatePresence mode="wait">
        {!activeCollection ? (
          // --- VIEW 1: GALLERY OVERVIEW (Horizontal Scroll) ---
          <motion.div 
            key="gallery-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="h-[85vh] w-full flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 md:px-20 gap-8"
          >
            {collections.map((col, index) => (
              <motion.div 
                key={col.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveCollectionId(col.id)}
                className="relative flex-shrink-0 w-[85vw] md:w-[600px] h-[70vh] rounded-[2rem] overflow-hidden cursor-pointer group snap-center border border-white/5"
              >
                {/* Background Image with Brush Mask Effect simulation via gradient */}
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                     style={{ backgroundImage: `url(${col.coverImage})` }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                
                {/* Theme Color Tint */}
                <div 
                    className="absolute inset-0 opacity-40 mix-blend-color" 
                    style={{ backgroundColor: col.themeColor }} 
                />

                {/* Content */}
                <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end items-start">
                    {/* Curator Note Card */}
                    <div className="mb-auto transform -rotate-2 bg-white/10 backdrop-blur-md border border-white/10 p-4 max-w-xs rounded-lg shadow-xl translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                <User size={12} className="text-zinc-400" />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-500">Curator's Note</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-serif italic leading-relaxed">"{col.description}"</p>
                        <p className="text-[10px] text-right mt-2 text-zinc-500 font-bold">- {col.curator}</p>
                    </div>

                    {/* Title Layering */}
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                            {col.title.split(' ').map((word, i) => (
                                <span key={i} className="block">{word}</span>
                            ))}
                        </h2>
                        
                        {/* Smart Metadata */}
                        <div className="flex items-center gap-6 text-sm font-medium text-zinc-400 mt-4">
                            <span className="flex items-center gap-2">
                                <Film size={16} /> {getCollectionMovies(col).length} Titles
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock size={16} /> {col.totalRuntime}
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Enter Collection</span>
                        <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center">
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // --- VIEW 2: COLLECTION DETAIL (Liquid Transition) ---
          <motion.div 
            key="collection-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 bg-[#09090b]">
                 <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${activeCollection.coverImage})` }} />
                 <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/90 to-[#09090b]" />
            </div>

            <div className="relative z-10 px-6 md:px-20 pb-20">
                {/* Navigation Back */}
                <button 
                    onClick={() => setActiveCollectionId(null)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white mb-12 group transition-colors"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold tracking-widest uppercase">Back to Gallery</span>
                </button>

                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20">
                    <div className="flex-1">
                         <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-white mb-6 mix-blend-overlay opacity-90">
                            {activeCollection.title}
                         </h1>
                         <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                             <p className="text-xl text-zinc-400 font-serif italic max-w-lg border-l-4 border-yellow-500 pl-6">
                                "{activeCollection.description}"
                             </p>
                             <button className="flex items-center gap-4 px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-2xl">
                                <Shuffle size={20} /> Play Collection
                             </button>
                         </div>
                    </div>
                    {/* Layered Character Art (Parallax) */}
                    {activeCollection.heroCharacterUrl && (
                        <motion.div 
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="hidden lg:block w-[400px] h-[400px] relative pointer-events-none"
                        >
                            <img 
                                src={activeCollection.heroCharacterUrl} 
                                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                alt="Hero"
                            />
                        </motion.div>
                    )}
                </div>

                {/* Asymmetrical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
                    {getCollectionMovies(activeCollection).map((movie, index) => (
                        <motion.div
                            key={movie.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            // Add offset for odd items to create asymmetry
                            className={`${index % 2 !== 0 ? 'md:translate-y-16' : ''} group cursor-pointer`}
                            onClick={() => onSelectMovie(movie)}
                        >
                            {/* Film Strip Card Style */}
                            <div className="relative aspect-[16/9] rounded-lg overflow-hidden border-y-8 border-black shadow-2xl mb-4 bg-zinc-900">
                                {/* Perforation holes simulation */}
                                <div className="absolute left-2 top-0 bottom-0 w-2 flex flex-col justify-between py-1 z-20">
                                    {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-2 bg-white/10 rounded-sm"></div>)}
                                </div>
                                <div className="absolute right-2 top-0 bottom-0 w-2 flex flex-col justify-between py-1 z-20">
                                    {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-2 bg-white/10 rounded-sm"></div>)}
                                </div>

                                <img 
                                    src={movie.backdropUrl} 
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 filter grayscale group-hover:grayscale-0"
                                    alt={movie.title}
                                />
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Play fill="white" className="text-white" />
                                    </div>
                                </div>

                                {/* Runtime Badge */}
                                <div className="absolute bottom-2 right-6 bg-black text-white text-[10px] font-mono px-2 py-0.5">
                                    {movie.duration}
                                </div>
                            </div>

                            <div className="pl-4 border-l border-zinc-800 group-hover:border-yellow-500 transition-colors">
                                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-yellow-500 transition-colors">{movie.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 uppercase tracking-widest">
                                    <span>{movie.year}</span>
                                    <span>•</span>
                                    <span>{movie.genre[0]}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-40 text-center">
                    <p className="text-zinc-600 font-serif italic">"End of Collection"</p>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
