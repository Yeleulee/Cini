import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { MovieCard } from './components/MovieCard';
import { PlayerOverlay } from './components/PlayerOverlay';
import { Search } from './components/Search';

import { CollectionsView } from './components/CollectionsView';
import { getFeaturedContent, getCollections } from './services/movieService';
import { Movie, Collection } from './types';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [currentPlayerMovie, setCurrentPlayerMovie] = useState<Movie | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOME' | 'MOVIES' | 'SERIES' | 'COLLECTIONS'>('HOME');
  const [activeCategory, setActiveCategory] = useState('Recommended');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const fetchedMovies = await getFeaturedContent();
        setMovies(fetchedMovies);
        setFilteredMovies(fetchedMovies);
        setCollections(getCollections());
      } catch (e) {
        console.error("Failed to load initial content", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Filtering Logic
  useEffect(() => {
    const filterContent = () => {
      let base = [...movies];

      // Filter by Tab
      if (activeTab === 'MOVIES') {
        base = base.filter(m => m.type === 'movie');
      } else if (activeTab === 'SERIES') {
        base = base.filter(m => m.type === 'series');
      }

      // Filter by Category
      if (activeCategory === 'My List') {
        try {
          const watchlist = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
          const watchlistIds = watchlist.map((m: Movie) => m.id);
          base = base.filter(m => watchlistIds.includes(m.id));
        } catch (e) {
          base = [];
        }
      } else if (activeCategory === 'Sci-Fi') {
        base = base.filter(m => m.genre.some(g => g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('fantasy')));
      } else if (activeCategory === 'Award Winners') {
        base = base.filter(m => m.tagline?.toLowerCase().includes('nominated') || m.tagline?.toLowerCase().includes('won') || parseFloat(m.rating) > 8.0);
      }

      setFilteredMovies(base);
    };

    filterContent();

    // Listen for watchlist updates from MovieCard
    const handleWatchlistUpdate = () => filterContent();
    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);

  }, [activeTab, activeCategory, movies]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">Initializing CineFlow Engine...</p>
      </div>
    );
  }

  const handleMovieSelect = (movie: Movie) => {
    setCurrentPlayerMovie(movie);
  };

  const categories = ['Recommended', 'Trending', 'My List', 'New Releases', 'Sci-Fi', 'Award Winners'];

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-yellow-500 selection:text-black">
      <Navigation
        onSearchClick={() => setIsSearchOpen(true)}
        onHomeClick={() => { setActiveTab('HOME'); setActiveCategory('Recommended'); }}
        onMoviesClick={() => { setActiveTab('MOVIES'); setActiveCategory('Recommended'); }}
        onSeriesClick={() => { setActiveTab('SERIES'); setActiveCategory('Recommended'); }}
        onCollectionsClick={() => setActiveTab('COLLECTIONS')}
        activeTab={activeTab}
      />

      <main className="pl-0 md:pl-20">

        {activeTab !== 'COLLECTIONS' ? (
          <>
            <div className="fixed top-0 left-0 right-0 z-0">
              <Hero movies={movies} onPlay={setCurrentPlayerMovie} />
            </div>

            {/* Content Section - The "Sheet" rising up */}
            <div className="relative z-20 mt-[85vh] bg-[#09090b] rounded-t-[3rem] shadow-[0_-25px_50px_rgba(0,0,0,0.8)] border-t border-white/5 min-h-screen pb-20">

              {/* Decorative Top Blur */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-3/4 h-32 bg-black/20 blur-3xl rounded-full pointer-events-none" />

              <div className="px-6 md:px-12 pt-16">
                {/* Section Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-12 gap-8">
                  <div>
                    <motion.h3
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase mb-2 ml-1"
                    >
                      {activeTab === 'HOME' ? 'The Library' : activeTab === 'MOVIES' ? 'Cinematic Canvas' : 'Episodic Journey'}
                    </motion.h3>
                    <motion.h2
                      key={activeTab + '-title'}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-4xl md:text-6xl font-medium tracking-tighter text-white"
                    >
                      {activeTab === 'HOME' ? 'Curated Collection' : activeTab === 'MOVIES' ? 'Feature Films' : 'Series & Seasons'}
                    </motion.h2>
                  </div>

                  {/* Modern Filter Pills */}
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                    {categories.map((cat, i) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${activeCategory === cat
                          ? 'text-black bg-white border-white'
                          : 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:text-white'
                          }`}
                      >
                        {cat === 'My List' && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* The Grid */}
                <motion.div
                  layout
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10 min-h-[50vh]"
                >
                  <AnimatePresence mode='popLayout'>
                    {filteredMovies.length > 0 ? filteredMovies.map((movie, index) => (
                      <MovieCard
                        key={`${movie.id}-${activeCategory}`}
                        movie={movie}
                        index={index}
                        onSelect={handleMovieSelect}
                      />
                    )) : (
                      <div className="col-span-full text-center py-20">
                        <p className="text-zinc-600 text-lg font-serif italic mb-4">
                          {activeCategory === 'My List'
                            ? "Your cinematic vault is empty. Add titles to get started."
                            : "No titles found in this category."}
                        </p>
                        {activeCategory === 'My List' && (
                          <button
                            onClick={() => setActiveCategory('Recommended')}
                            className="px-6 py-2 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                          >
                            Explore Library
                          </button>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="mt-32 border-t border-zinc-900 pt-10 flex flex-col items-center justify-center text-zinc-700 text-xs font-medium tracking-widest uppercase">
                  <p className="mb-2">Project CineFlow Ultra v2.0</p>
                  <p>Powered by OMDb API</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Collections View Component
          <CollectionsView
            collections={collections}
            allMovies={movies}
            onSelectMovie={handleMovieSelect}
          />
        )}
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {currentPlayerMovie && (
          <PlayerOverlay movie={currentPlayerMovie} onClose={() => setCurrentPlayerMovie(null)} />
        )}
      </AnimatePresence>

      <Search
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleMovieSelect}
      />


    </div>
  );
};

export default App;