import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { searchMovies, getMovieDetails } from '../services/movieService';

interface SearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (movie: Movie) => void;
}

export const Search: React.FC<SearchProps> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Debounce search
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 2) {
                setIsLoading(true);
                const searchResults = await searchMovies(query);
                setResults(searchResults);
                setIsLoading(false);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = async (movie: Movie) => {
        // Fetch full details before selecting because search returns partial data
        setIsLoading(true);
        const fullDetails = await getMovieDetails(movie.id);
        setIsLoading(false);
        onSelect(fullDetails || movie);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-md flex items-start justify-center pt-32 transition-opacity">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="relative flex items-center p-4 border-b border-zinc-800">
                    <SearchIcon className="w-6 h-6 text-zinc-400 mr-3" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search OMDb database..."
                        className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-zinc-500 h-10"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {isLoading ? (
                        <Loader className="w-5 h-5 text-yellow-500 animate-spin mr-2" />
                    ) : (
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto no-scrollbar bg-black/20">
                    {results.length > 0 ? (
                        <div className="p-2">
                            {results.map(movie => (
                                <div
                                    key={movie.id}
                                    onClick={() => handleSelect(movie)}
                                    className="flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-zinc-700"
                                >
                                    <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded-md bg-zinc-900" />
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium group-hover:text-yellow-400 transition-colors">{movie.title}</h4>
                                        <p className="text-zinc-500 text-sm">{movie.year} • {movie.type === 'series' ? 'Series' : 'Movie'}</p>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 border border-zinc-700 px-2 py-1 rounded">IMDb</span>
                                </div>
                            ))}
                        </div>
                    ) : query.length > 2 && !isLoading ? (
                        <div className="p-8 text-center text-zinc-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="p-6">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Trending on OMDb</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Oppenheimer', 'Barbie', 'Ahsoka', 'One Piece', 'Blue Beetle'].map(t => (
                                    <button key={t} onClick={() => setQuery(t)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 transition border border-zinc-700">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
