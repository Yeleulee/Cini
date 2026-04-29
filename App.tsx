import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { MovieCard } from './components/MovieCard';
import { PlayerOverlay } from './components/PlayerOverlay';
import { Search } from './components/Search';

import { CollectionsView } from './components/CollectionsView';
import { getFeaturedContent } from './services/movieService';
import { getGenreMovies, GENRES, Genre } from './services/genreService';
import { Movie } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';

// ─── Genre Browser ────────────────────────────────────────────────────────────

interface GenreSectionProps {
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

const GenreSection: React.FC<GenreSectionProps> = ({ allMovies, onSelectMovie }) => {
  const [activeGenre, setActiveGenre] = useState<Genre>(GENRES[0]);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    abortRef.current = false;
    setLoading(true);
    setGenreMovies([]);

    getGenreMovies(activeGenre, allMovies, (updated) => {
      if (!abortRef.current) {
        setGenreMovies(updated);
        setLoading(false);
      }
    }).then((initial) => {
      if (!abortRef.current) {
        setGenreMovies(initial);
        if (initial.length > 0) setLoading(false);
      }
    });

    return () => { abortRef.current = true; };
  }, [activeGenre.id, allMovies]);

  return (
    <section className="px-6 md:px-12 mt-20 pb-10">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 rounded-full bg-yellow-500" />
        <div>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.25em] uppercase">Explore by</p>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">Genre</h2>
        </div>
      </div>

      {/* Genre pill tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-8">
        {GENRES.map((genre) => {
          const isActive = genre.id === activeGenre.id;
          return (
            <motion.button
              key={genre.id}
              onClick={() => setActiveGenre(genre)}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${isActive
                ? 'text-black border-transparent shadow-lg'
                : 'text-zinc-400 bg-zinc-900/60 border-zinc-800 hover:border-zinc-600 hover:text-white'
                }`}
              style={isActive ? { backgroundColor: genre.color, borderColor: genre.color } : {}}
            >
              <span className="text-sm leading-none">{genre.icon}</span>
              {genre.label}
            </motion.button>
          );
        })}
      </div>

      {/* Grid or loading state */}
      <AnimatePresence mode="wait">
        {loading && genreMovies.length === 0 ? (
          <motion.div
            key="genre-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20 gap-3 text-zinc-600"
          >
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading {activeGenre.label}…</span>
          </motion.div>
        ) : genreMovies.length === 0 ? (
          <motion.div
            key="genre-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-zinc-600"
          >
            <Flame size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-bold">No titles yet for {activeGenre.label}</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeGenre.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-9"
          >
            {genreMovies.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={index}
                onSelect={onSelectMovie}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colour accent line */}
      <motion.div
        key={activeGenre.id + '-line'}
        className="h-px mt-16 rounded-full opacity-30"
        style={{ backgroundColor: activeGenre.color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
    </section>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

type TabId = 'HOME' | 'MOVIES' | 'SERIES' | 'COLLECTIONS';

const CATEGORIES = ['Recommended', 'Trending', 'New Releases', 'My List', 'Sci-Fi', 'Award Winners'];

const App: React.FC = () => {
  // ── Data State ─────────────────────────────────────────────────────────────
  const [movies, setMovies] = useState<Movie[]>([]);

  // ── UI State ───────────────────────────────────────────────────────────────
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [currentPlayerMovie, setCurrentPlayerMovie] = useState<Movie | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('HOME');
  const [activeCategory, setActiveCategory] = useState('Recommended');
  const [loading, setLoading] = useState(true);

  // ── Initial Data Load ──────────────────────────────────────────────────────
  useEffect(() => {
    const initData = async () => {
      try {
        // Returns fallback instantly, then hydrates incrementally from OMDb
        const initial = await getFeaturedContent((updated) => {
          setMovies(updated);
          setFilteredMovies(updated);
        });
        setMovies(initial);
        setFilteredMovies(initial);
      } catch (e) {
        console.error('Failed to load content', e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // ── Filtering Logic ────────────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const filterContent = () => {
      let base = [...movies];
      if (activeTab === 'MOVIES') base = base.filter(m => m.type === 'movie');
      else if (activeTab === 'SERIES') base = base.filter(m => m.type === 'series');

      if (activeCategory === 'My List') {
        try {
          const wl = JSON.parse(localStorage.getItem('cineflow_watchlist') || '[]');
          const ids = wl.map((m: Movie) => m.id);
          base = base.filter(m => ids.includes(m.id));
        } catch { base = []; }
      } else if (activeCategory === 'Trending') {
        base = base
          .filter(m => parseFloat(m.rating) >= 7.5)
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (activeCategory === 'New Releases') {
        base = base
          .filter(m => m.year >= 2023)
          .sort((a, b) => b.year - a.year || parseFloat(b.rating) - parseFloat(a.rating));
      } else if (activeCategory === 'Sci-Fi') {
        base = base.filter(m =>
          m.genre.some(g => g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('fantasy') || g.toLowerCase().includes('science'))
        );
      } else if (activeCategory === 'Award Winners') {
        base = base.filter(m =>
          m.tagline?.toLowerCase().includes('nominated') ||
          m.tagline?.toLowerCase().includes('won') ||
          m.tagline?.toLowerCase().includes('oscar') ||
          parseFloat(m.rating) > 8.0
        );
      }

      setFilteredMovies(base);
    };

    filterContent();
    const onWatchlistUpdate = () => filterContent();
    window.addEventListener('watchlistUpdated', onWatchlistUpdate);
    return () => window.removeEventListener('watchlistUpdated', onWatchlistUpdate);
  }, [activeTab, activeCategory, movies]);

  // ── Loading Screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-zinc-500">Initializing CineFlow Engine…</p>
      </div>
    );
  }

  const handleMovieSelect = (movie: Movie) => setCurrentPlayerMovie(movie);

  const sectionLabel = activeTab === 'HOME' ? 'The Library' : activeTab === 'MOVIES' ? 'Cinematic Canvas' : 'Episodic Journey';
  const sectionTitle = activeTab === 'HOME' ? 'Curated Collection' : activeTab === 'MOVIES' ? 'Feature Films' : 'Series & Seasons';

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
        {activeTab === 'COLLECTIONS' ? (
          <CollectionsView onSelectMovie={handleMovieSelect} />
        ) : (
          <>
            {/* ── Hero Slider ── */}
            <div className="sticky top-0 w-full z-0">
              <Hero
                movies={movies.slice(0, 20)}
                onPlay={setCurrentPlayerMovie}
              />
            </div>

            {/* ── Content Sheet ── */}
            <div className="relative z-20 bg-[#09090b] rounded-t-[3rem] shadow-[0_-25px_50px_rgba(0,0,0,0.8)] border-t border-white/5 min-h-screen pb-24">

              {/* Fade edge */}
              <div className="absolute left-0 right-0 -top-24 h-24 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />

              <div className="px-6 md:px-12 pt-16">

                {/* ── Section Header & Filter Pills ── */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-12 gap-8">
                  <div>
                    <motion.h3
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase mb-2 ml-1"
                    >
                      {sectionLabel}
                    </motion.h3>
                    <motion.h2
                      key={activeTab + '-title'}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                      className="text-3xl md:text-4xl font-medium tracking-tighter text-white"
                    >
                      {activeCategory === 'New Releases' ? 'New Releases' : sectionTitle}
                    </motion.h2>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${activeCategory === cat
                          ? 'text-black bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.35)]'
                          : 'icon-glass text-zinc-300 border-transparent hover:border-white/10 hover:text-white shadow-lg'
                          }`}
                      >
                        {cat === 'My List' && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
                          </span>
                        )}
                        {cat === 'New Releases' && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                          </span>
                        )}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Main Movie Grid ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${activeCategory}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10 min-h-[50vh]"
                  >
                    {filteredMovies.length > 0 ? (
                      filteredMovies.map((movie, index) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          index={index}
                          onSelect={handleMovieSelect}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20">
                        <p className="text-zinc-600 text-lg font-serif italic mb-4">
                          {activeCategory === 'My List'
                            ? 'Your cinematic vault is empty. Add titles to get started.'
                            : 'No titles found in this category.'}
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
                  </motion.div>
                </AnimatePresence>

                {/* ── Genre Browser ── */}
                <GenreSection allMovies={movies} onSelectMovie={handleMovieSelect} />

                {/* Footer */}
                <div className="mt-20 border-t border-zinc-900 pt-10 flex flex-col items-center justify-center text-zinc-700 text-xs font-medium tracking-widest uppercase">
                  <p className="mb-1">Project CineFlow Ultra v2.1</p>
                  <p>Powered by OMDb API</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Player Overlay */}
      <AnimatePresence>
        {currentPlayerMovie && (
          <PlayerOverlay
            movie={currentPlayerMovie}
            onClose={() => setCurrentPlayerMovie(null)}
          />
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