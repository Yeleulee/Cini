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

// --- API Key Rotation (same pool as movieService) ---
const API_KEYS = ['4ba2f2d6', 'f6bca86f'];
let _gKeyIndex = 0;
const getApiKey = () => {
    const key = API_KEYS[_gKeyIndex % API_KEYS.length];
    _gKeyIndex++;
    return key;
};
const BASE_URL = 'https://www.omdbapi.com/';

// TMDB image base — no API key required for direct image paths
const TMDB_IMG = 'https://image.tmdb.org/t/p';

// Known TMDB backdrop paths for curated IDs, so genre cards look cinematic
const TMDB_BACKDROPS: Record<string, string> = {
    'tt4154796': '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',  // Avengers: Endgame
    'tt3501632': '/x4WJ0FXJV6IISC2kIqe3QHX7VsP.jpg',  // Thor: Ragnarok
    'tt0133093': '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',  // The Matrix
    'tt0910970': '/hbhFnRzzg6ZDmm8YAmxBnQ3vXfH.jpg',  // WALL-E
    'tt0111161': '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',  // The Shawshank Redemption
    'tt0068646': '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',  // The Godfather
    'tt0120737': '/5VTN0pR8gcqV3EPUHHfMGnJYspL.jpg',  // LOTR: Fellowship
    'tt0167260': '/lXhgCODAbBXL5buk9yEmTpOoOgR.jpg',  // LOTR: Return of the King
    'tt2267998': '/5cdD7FiD5ZVnMi5cBCLOzHGBLBM.jpg',  // Gone Girl
    'tt1375666': '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',  // Inception
    'tt0114369': '/6bbZ6XyvgfjhQwbplnUh1LSj1ky.jpg',  // Se7en
    'tt7286456': '/n6bUvigpRFqSwmPp1m2YAjPP1qO.jpg',  // Joker
    'tt0993846': '/loBPpHHb3LM1p0TrFRGskifAzCL.jpg',  // The Wolf of Wall Street
    'tt4154664': '/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg',  // Captain Marvel
    'tt0317219': '/3CxUndGhUcZdt1Zggjdb2HkLLQX.jpg',  // Cars
    'tt4853102': '/nNmJruT8RRD0GFb1sCShXBZqSj9.jpg',  // Klaus
};

// Generic cinema placeholder from TMDB (no Unsplash)
const GENERIC_POSTER = `${TMDB_IMG}/w500/gEFcDMzDiXgFHSFJIlSCeIefvLe.jpg`;

function getHighResPoster(url: string): string {
    if (!url || url === 'N/A') return GENERIC_POSTER;
    // Remove OMDb resize suffix to get the original full-res image
    return url.replace(/\._V1_.*\.jpg$/g, '.jpg');
}

function omdbToMovie(data: any): Movie {
    const isSeries = data.Type === 'series';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.5';
    const poster = getHighResPoster(data.Poster);
    const genres = data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : ['Cinema'];

    // Use a known TMDB backdrop if available, otherwise fall back to the OMDb poster
    const tmdbBackdropPath = TMDB_BACKDROPS[data.imdbID];
    const backdropUrl = tmdbBackdropPath
        ? `${TMDB_IMG}/original${tmdbBackdropPath}`
        : poster;
    const heroUrl = tmdbBackdropPath
        ? `${TMDB_IMG}/w1280${tmdbBackdropPath}`
        : poster;

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
        backdropUrl,
        heroUrl,
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
                        const res = await fetch(`${BASE_URL}?apikey=${getApiKey()}&i=${id}&plot=full`);
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
