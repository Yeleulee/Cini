import { Movie } from '../types';

export interface Genre {
    id: string;
    label: string;
    icon: string;           // emoji shorthand
    color: string;          // accent colour for the active tab
    imdbIds: string[];      // curated real IDs for this genre
}

// Each genre lists 6-8 hand-picked IMDb IDs that are truly representative.
// These are used to hydrate the genre grid from OMDb when that tab is selected.
export const GENRES: Genre[] = [
    {
        id: 'action',
        label: 'Action',
        icon: '⚡',
        color: '#ef4444',
        imdbIds: [
            'tt1877830', // The Batman
            'tt9362722', // Spider-Man: Across the Spider-Verse
            'tt1160419', // Dune
            'tt5180504', // The Witcher
            'tt4154796', // Avengers: Endgame
            'tt3501632', // Thor: Ragnarok
        ],
    },
    {
        id: 'sci-fi',
        label: 'Sci-Fi',
        icon: '🚀',
        color: '#6366f1',
        imdbIds: [
            'tt0816692', // Interstellar
            'tt1856101', // Blade Runner 2049
            'tt1160419', // Dune
            'tt12566356',// Cyberpunk: Edgerunners
            'tt0133093', // The Matrix
            'tt0910970', // WALL-E
        ],
    },
    {
        id: 'drama',
        label: 'Drama',
        icon: '🎭',
        color: '#f59e0b',
        imdbIds: [
            'tt0816692', // Interstellar
            'tt1877830', // The Batman
            'tt0111161', // The Shawshank Redemption
            'tt0068646', // The Godfather
            'tt0120737', // The Lord of the Rings: Fellowship
            'tt0167260', // LOTR: Return of the King
        ],
    },
    {
        id: 'animation',
        label: 'Animation',
        icon: '🎨',
        color: '#8b5cf6',
        imdbIds: [
            'tt9362722', // Spider-Man: Across the Spider-Verse
            'tt11126994',// Arcane
            'tt12566356',// Cyberpunk: Edgerunners
            'tt0317219', // Cars
            'tt0910970', // WALL-E
            'tt4853102', // Klaus
        ],
    },
    {
        id: 'thriller',
        label: 'Thriller',
        icon: '🔪',
        color: '#10b981',
        imdbIds: [
            'tt1877830', // The Batman
            'tt1856101', // Blade Runner 2049
            'tt2267998', // Gone Girl
            'tt1375666', // Inception
            'tt0816692', // Interstellar
            'tt0114369', // Se7en
        ],
    },
    {
        id: 'comedy',
        label: 'Comedy',
        icon: '😂',
        color: '#f97316',
        imdbIds: [
            'tt3501632', // Thor: Ragnarok
            'tt7286456', // Joker (dark comedy)
            'tt0993846', // The Wolf of Wall Street
            'tt4154664', // Captain Marvel
            'tt0910970', // WALL-E
            'tt0317219', // Cars
        ],
    },
    {
        id: 'fantasy',
        label: 'Fantasy',
        icon: '🧙',
        color: '#14b8a6',
        imdbIds: [
            'tt5180504', // The Witcher
            'tt11126994',// Arcane
            'tt0120737', // LOTR: Fellowship
            'tt0167260', // LOTR: Return of the King
            'tt3501632', // Thor: Ragnarok
            'tt4154796', // Avengers: Endgame
        ],
    },
    {
        id: 'mystery',
        label: 'Mystery',
        icon: '🔍',
        color: '#ec4899',
        imdbIds: [
            'tt1877830', // The Batman
            'tt1856101', // Blade Runner 2049
            'tt2267998', // Gone Girl
            'tt0114369', // Se7en
            'tt1375666', // Inception
            'tt0133093', // The Matrix
        ],
    },
];

// ── cache so we don't re-fetch already loaded genre movies ──────────────────
const _genreCache = new Map<string, Movie[]>();

const API_KEY = '4ba2f2d6';
const BASE_URL = 'https://www.omdbapi.com/';

function getHighResPoster(url: string) {
    if (!url || url === 'N/A')
        return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
    return url.replace(/\._V1_.*\.jpg$/g, '.jpg');
}

function omdbToMovie(data: any): Movie {
    const isSeries = data.Type === 'series';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.5';
    const poster = getHighResPoster(data.Poster);
    const genres = data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : ['Cinema'];
    return {
        id: data.imdbID,
        title: data.Title,
        year: parseInt(data.Year) || new Date().getFullYear(),
        duration: data.Runtime !== 'N/A' ? data.Runtime : 'N/A',
        genre: genres,
        rating,
        quality: parseFloat(rating) >= 7.5 ? '4K' : 'HD',
        synopsis: data.Plot !== 'N/A' ? data.Plot : '',
        posterUrl: poster,
        backdropUrl: poster,
        heroUrl: poster,
        tagline: (data.Awards && data.Awards !== 'N/A' ? data.Awards : data.Title).toUpperCase(),
        cast: data.Actors ? data.Actors.split(', ') : [],
        director: data.Director !== 'N/A' ? data.Director : 'Unknown',
        matchScore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : 80,
        primaryColor: '#1a1a1a',
        type: isSeries ? 'series' : 'movie',
        downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: data.Plot || 'A cinematic experience.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM',
    };
}

/**
 * Returns movies for a genre.
 * 1. Instantly returns any already-loaded movie from the main catalogue that
 *    matches the genre (from `catalogueMovies`) so the grid is never empty.
 * 2. Simultaneously fetches the curated IDs from OMDb in the background and
 *    calls `onUpdate` with the enriched list as each one arrives.
 */
export async function getGenreMovies(
    genre: Genre,
    catalogueMovies: Movie[],
    onUpdate: (movies: Movie[]) => void,
): Promise<Movie[]> {
    // 1. Immediate result from already-loaded movies
    const instant = catalogueMovies.filter(m =>
        m.genre.some(g => g.toLowerCase() === genre.label.toLowerCase()) ||
        genre.imdbIds.includes(m.id)
    );

    // Return from cache if available
    if (_genreCache.has(genre.id)) {
        return _genreCache.get(genre.id)!;
    }

    // Kick off background fetch without blocking the caller
    (async () => {
        try {
            const seen = new Set(instant.map(m => m.id));
            let accumulated: Movie[] = [...instant];

            await Promise.all(
                genre.imdbIds.map(async (id) => {
                    if (seen.has(id)) return;
                    try {
                        const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
                        const data = await res.json();
                        if (data.Response === 'True') {
                            const movie = omdbToMovie(data);
                            seen.add(id);
                            accumulated = [...accumulated, movie];
                            onUpdate([...accumulated]);
                        }
                    } catch { /* skip */ }
                })
            );

            _genreCache.set(genre.id, accumulated);
        } catch { /* silent */ }
    })();

    return instant;
}
