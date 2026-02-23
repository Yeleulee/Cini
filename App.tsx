import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { MovieCard } from './components/MovieCard';
import { PlayerOverlay } from './components/PlayerOverlay';
import { Search } from './components/Search';
import { AIAssistant } from './components/AIAssistant';
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
            if (!abortRef.current) setGenreMovies(updated);
        }).then((initial) => {
            if (!abortRef.current) {
                setGenreMovies(initial);
                setLoading(initial.length === 0);
            }
        });

        return () => { abortRef.current = true; };
    }, [activeGenre.id, allMovies]);

    // Once we have results stop the spinner
    useEffect(() => {
        if (genreMovies.length > 0) setLoading(false);
    }, [genreMovies]);

    return (
        <section className="px-6 md:px-12 mt-20 pb-10">
            {/* Section heading */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-yellow-500" />
                <div>
                    <p className="text-zinc-500 text-[10px] font-bold tracking-[0.25em] uppercase">Explore by</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">Genre</h2>
                </div>
            </div>

            {/* Genre pill tabs — horizontal scroll on mobile */}
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
                        <AnimatePresence mode="popLayout">
                            {genreMovies.map((movie, index) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    index={index}
                                    onSelect={onSelectMovie}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Colour accent line matching selected genre */}
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

const categories = ['Recommended', 'Trending', 'New Releases', 'Sci-Fi', 'Award Winners'];

const App: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [currentPlayerMovie, setCurrentPlayerMovie] = useState<Movie | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('HOME');
    const [activeCategory, setActiveCategory] = useState('Recommended');
    const [isHydrating, setIsHydrating] = useState(true);

    // Load master movie catalogue
    useEffect(() => {
        const init = async () => {
            try {
                const initial = await getFeaturedContent((updated) => {
                    setMovies(updated);
                    setFilteredMovies(updated);
                });
                setMovies(initial);
                setFilteredMovies(initial);
            } catch (e) {
                console.error('Failed to load content', e);
            } finally {
                setTimeout(() => setIsHydrating(false), 4000);
            }
        };
        init();
    }, []);

    // Filter movies when tab changes + scroll to top
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        if (activeTab === 'HOME') setFilteredMovies(movies);
        else if (activeTab === 'MOVIES') setFilteredMovies(movies.filter(m => m.type === 'movie'));
        else if (activeTab === 'SERIES') setFilteredMovies(movies.filter(m => m.type === 'series'));
    }, [activeTab, movies]);

    const handleMovieSelect = (movie: Movie) => setCurrentPlayerMovie(movie);

    const tabLabel = activeTab === 'HOME' ? 'The Library' :
        activeTab === 'MOVIES' ? 'Cinematic Canvas' : 'Episodic Journey';
    const tabTitle = activeTab === 'HOME' ? 'All Titles' :
        activeTab === 'MOVIES' ? 'Feature Films' : 'Series & Seasons';

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-yellow-500 selection:text-black">

            {/* Subtle hydration indicator */}
            <AnimatePresence>
                {isHydrating && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-400 shadow-xl"
                    >
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        Fetching HD content…
                    </motion.div>
                )}
            </AnimatePresence>

            <Navigation
                onSearchClick={() => setIsSearchOpen(true)}
                onHomeClick={() => setActiveTab('HOME')}
                onMoviesClick={() => setActiveTab('MOVIES')}
                onSeriesClick={() => setActiveTab('SERIES')}
                onCollectionsClick={() => setActiveTab('COLLECTIONS')}
                activeTab={activeTab}
            />

            <main className="pl-0 md:pl-20">

                {activeTab === 'COLLECTIONS' ? (
                    <CollectionsView onSelectMovie={handleMovieSelect} />
                ) : (
                    <>
                        {/* ── Hero ── */}
                        <div className="fixed top-0 left-0 right-0 z-0">
                            <Hero movies={movies} onPlay={setCurrentPlayerMovie} />
                        </div>

                        {/* ── Content sheet ── */}
                        <div className="relative z-20 mt-[85vh] bg-[#09090b] rounded-t-[3rem] shadow-[0_-25px_50px_rgba(0,0,0,0.8)] border-t border-white/5 min-h-screen pb-24">

                            {/* Fade edge */}
                            <div className="absolute left-0 right-0 -top-16 h-16 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />

                            <div className="px-6 md:px-12 pt-16">

                                {/* ── Section header & filter pills ── */}
                                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-12 gap-8">
                                    <div>
                                        <motion.h3
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase mb-2 ml-1"
                                        >
                                            {tabLabel}
                                        </motion.h3>
                                        <motion.h2
                                            key={activeTab + '-title'}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.08 }}
                                            className="text-4xl md:text-6xl font-medium tracking-tighter text-white"
                                        >
                                            {tabTitle}
                                        </motion.h2>
                                    </div>

                                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${activeCategory === cat
                                                        ? 'text-black bg-white border-white'
                                                        : 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:text-white'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Main movie grid ── */}
                                <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10 min-h-[50vh]">
                                    <AnimatePresence mode="popLayout">
                                        {filteredMovies.length > 0
                                            ? filteredMovies.map((movie, index) => (
                                                <MovieCard
                                                    key={movie.id}
                                                    movie={movie}
                                                    index={index}
                                                    onSelect={handleMovieSelect}
                                                />
                                            ))
                                            : (
                                                <div className="col-span-full text-center py-20 text-zinc-600">
                                                    No titles found in this category.
                                                </div>
                                            )
                                        }
                                    </AnimatePresence>
                                </motion.div>

                                {/* ── Genre Browser (Home / Movies / Series tabs only) ── */}
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

            {/* Player overlay */}
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

            <AIAssistant currentContext={movies[0]?.title || 'Home'} />
        </div>
    );
};

export default App;
