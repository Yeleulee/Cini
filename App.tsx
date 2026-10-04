import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { MovieCard, readWatchlistIds } from './components/MovieCard';
import { PlayerOverlay } from './components/PlayerOverlay';
import { Search } from './components/Search';
import { CollectionsView } from './components/CollectionsView';
import { MediaRow } from './components/MediaRow';
import { ProviderRow } from './components/ProviderRow';
import { getFeaturedContent } from './services/movieService';
import { getGenreMovies, GENRES, Genre } from './services/genreService';
import { Movie } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

type TabId = 'HOME' | 'MOVIES' | 'SERIES' | 'COLLECTIONS';
type TypeFilter = 'all' | 'movie' | 'series';

interface RowDef {
  id: string;
  title: string;
  movies: Movie[];
}

// ─── Genre row: fetches only once it scrolls into view ───────────────────────

interface GenreRowProps {
  genre: Genre;
  allMovies: Movie[];
  typeFilter: TypeFilter;
  onSelect: (m: Movie) => void;
  onViewAll: (title: string, movies: Movie[]) => void;
}

const GenreRow: React.FC<GenreRowProps> = ({ genre, allMovies, typeFilter, onSelect, onViewAll }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getGenreMovies(genre, allMovies, (updated) => {
      if (!cancelled) { setMovies(updated); setLoading(false); }
    }).then((initial) => {
      if (!cancelled) { setMovies(initial); if (initial.length > 0) setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [visible, genre.id, allMovies]);

  const filtered = useMemo(
    () => (typeFilter === 'all' ? movies : movies.filter(m => m.type === typeFilter)),
    [movies, typeFilter],
  );

  // Keep a stable placeholder so the observer has something to intersect.
  if (!visible) return <div ref={ref} className="h-24" />;
  if (!loading && filtered.length === 0) return null;

  return (
    <div ref={ref}>
      <MediaRow
        title={genre.label}
        movies={filtered}
        loading={loading}
        onSelect={onSelect}
        onViewAll={() => onViewAll(genre.label, filtered)}
      />
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentPlayerMovie, setCurrentPlayerMovie] = useState<Movie | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('HOME');
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState<{ title: string; movies: Movie[] } | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => readWatchlistIds());

  useEffect(() => {
    const initData = async () => {
      try {
        const initial = await getFeaturedContent((updated) => setMovies(updated));
        setMovies(initial);
      } catch (e) {
        console.error('Failed to load content', e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const sync = () => setWatchlistIds(readWatchlistIds());
    window.addEventListener('watchlistUpdated', sync);
    return () => window.removeEventListener('watchlistUpdated', sync);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab, viewAll]);

  const typeFilter: TypeFilter = activeTab === 'MOVIES' ? 'movie' : activeTab === 'SERIES' ? 'series' : 'all';
  const base = useMemo(
    () => (typeFilter === 'all' ? movies : movies.filter(m => m.type === typeFilter)),
    [movies, typeFilter],
  );

  const rows = useMemo<RowDef[]>(() => {
    const byRating = (a: Movie, b: Movie) => parseFloat(b.rating) - parseFloat(a.rating);
    const label = typeFilter === 'movie' ? 'Movies' : typeFilter === 'series' ? 'Shows' : 'Titles';
    return [
      { id: 'trending', title: `Trending ${label}`, movies: [...base].filter(m => parseFloat(m.rating) >= 7.5).sort(byRating) },
      { id: 'new', title: 'New Releases', movies: [...base].filter(m => m.year >= 2023).sort((a, b) => b.year - a.year || byRating(a, b)) },
      { id: 'mylist', title: 'My List', movies: base.filter(m => watchlistIds.includes(m.id)) },
      { id: 'top', title: 'Top Rated', movies: [...base].filter(m => parseFloat(m.rating) > 8).sort(byRating) },
      { id: 'scifi', title: 'Sci-Fi & Fantasy', movies: base.filter(m => m.genre.some(g => /sci-fi|fantasy|science/i.test(g))) },
    ];
  }, [base, typeFilter, watchlistIds]);

  const handleMovieSelect = (movie: Movie) => setCurrentPlayerMovie(movie);
  const switchTab = (tab: TabId) => { setViewAll(null); setActiveTab(tab); };
  const openViewAll = (title: string, list: Movie[]) => setViewAll({ title, movies: list });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505] text-white">
        <Loader2 size={28} className="animate-spin text-white/70" />
        <p className="text-sm text-white/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#050505]" />

      <Navigation
        onSearchClick={() => setIsSearchOpen(true)}
        onHomeClick={() => switchTab('HOME')}
        onMoviesClick={() => switchTab('MOVIES')}
        onSeriesClick={() => switchTab('SERIES')}
        onCollectionsClick={() => switchTab('COLLECTIONS')}
        activeTab={activeTab}
      />

      <main className="relative z-10 flex min-h-screen flex-col">
        {activeTab === 'COLLECTIONS' ? (
          <div className="pt-20 lg:pt-28">
            <CollectionsView onSelectMovie={handleMovieSelect} />
          </div>
        ) : viewAll ? (
          <motion.section
            key={viewAll.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="px-6 pt-24 lg:px-16 lg:pt-32"
          >
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => setViewAll(null)}
                aria-label="Back"
                className="glass-header flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-95"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-2xl font-semibold text-white/90 lg:text-3xl">{viewAll.title}</h1>
              <span className="text-sm text-white/50">{viewAll.movies.length} titles</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {viewAll.movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} onSelect={handleMovieSelect} />
              ))}
            </div>
          </motion.section>
        ) : (
          <>
            <Hero movies={base.slice(0, 20)} onPlay={setCurrentPlayerMovie} />

            <div className="relative -mt-6 flex flex-col gap-2">
              {activeTab === 'HOME' && <ProviderRow />}

              {rows.map(row => (
                <MediaRow
                  key={row.id}
                  title={row.title}
                  movies={row.movies}
                  onSelect={handleMovieSelect}
                  onViewAll={() => openViewAll(row.title, row.movies)}
                />
              ))}

              {GENRES.map(genre => (
                <GenreRow
                  key={genre.id}
                  genre={genre}
                  allMovies={movies}
                  typeFilter={typeFilter}
                  onSelect={handleMovieSelect}
                  onViewAll={openViewAll}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="relative z-20 mt-auto w-full px-6 py-8 pb-28 lg:px-16 lg:pb-8">
          <div className="flex flex-col gap-3">
            <button onClick={() => switchTab('HOME')} className="flex w-fit items-center gap-2 text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">C</span>
              <span className="font-semibold">Cini</span>
            </button>
            <p className="max-w-xl text-sm text-white/50">
              Cini does not host, store, or distribute any media files. All content is sourced from third-party providers.
            </p>
            <a href="mailto:contact@cini.app" className="w-fit text-sm text-white/70 transition-colors hover:text-white">
              contact@cini.app
            </a>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {currentPlayerMovie && (
          <PlayerOverlay movie={currentPlayerMovie} onClose={() => setCurrentPlayerMovie(null)} />
        )}
      </AnimatePresence>

      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelect={handleMovieSelect} />
    </div>
  );
};

export default App;
