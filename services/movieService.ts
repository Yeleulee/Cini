import { Movie, Season, Collection } from '../types';

const API_KEY = '4ba2f2d6';
const BASE_URL = 'https://www.omdbapi.com/';

// --- ID Lists for Curated Experience ---
const FEATURED_IDS = [
    'tt1877830', // The Batman (First to match screenshot)
    'tt1160419', // Dune
    'tt12566356', // Cyberpunk: Edgerunners
    'tt0816692', // Interstellar
    'tt5180504', // The Witcher
    'tt9362722', // Spider-Man: Across the Spider-Verse
    'tt11126994', // Arcane
    'tt1856101', // Blade Runner 2049
];

// --- Helper Functions ---

const getHighResPoster = (url: string) => {
    if (!url || url === 'N/A') return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop';
    // OMDb/Amazon images usually have a resizing suffix like ._V1_SX300.jpg
    // Removing it often gives the original high-res version.
    return url.replace(/._V1_.*\.jpg$/g, '.jpg'); 
};

const mapOmdbToMovie = (data: any): Movie => {
    const isSeries = data.Type === 'series';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.8'; // Defaulting to screenshot value if missing
    const poster = getHighResPoster(data.Poster);
    
    // Logic to determine a good tagline. OMDb 'Awards' often looks cool like "Nominated for 3 Oscars".
    let tagline = "Cinematic Masterpiece";
    if (data.Awards && data.Awards !== 'N/A' && data.Awards.length > 10) {
        tagline = data.Awards;
    } else if (data.Plot && data.Plot.length < 50) {
        tagline = data.Plot;
    }

    // Genre parsing
    const genres = data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : ['Cinema'];

    return {
        id: data.imdbID,
        title: data.Title,
        year: parseInt(data.Year) || new Date().getFullYear(),
        duration: data.Runtime !== 'N/A' ? data.Runtime : 'Unknown',
        genre: genres,
        rating: rating,
        quality: parseFloat(rating) >= 7.5 ? '4K' : 'HD', // Logic to match premium feel
        synopsis: data.Plot !== 'N/A' ? data.Plot : 'No synopsis available for this title.',
        posterUrl: poster,
        backdropUrl: poster, // Using high-res poster as backdrop
        heroUrl: poster,
        tagline: tagline.toUpperCase(), // Ensure uppercase for the layout
        cast: data.Actors ? data.Actors.split(', ') : [],
        director: data.Director !== 'N/A' ? data.Director : 'Unknown Director',
        matchScore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : 85,
        primaryColor: '#1a1a1a', 
        type: isSeries ? 'series' : 'movie',
        seasons: isSeries ? [
            {
                id: 's1',
                number: 1,
                episodes: Array.from({length: 8}).map((_, i) => ({
                    id: `ep-${i}`,
                    number: i+1,
                    title: `Chapter ${i+1}`,
                    duration: '45m',
                    thumbnailUrl: poster,
                    synopsis: data.Plot
                }))
            }
        ] : undefined,
        downloadOptions: ['4K', '1080p', '720p'],
        criticReview: {
            text: data.Plot && data.Plot !== 'N/A' ? data.Plot : "A visual spectacle that redefines the genre.",
            author: 'Critic\'s Choice'
        },
        platformLogo: 'OMDb STREAM'
    };
};

// --- API Methods ---

export const searchMovies = async (query: string): Promise<Movie[]> => {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.Response === 'True' && data.Search) {
            return data.Search.map((item: any) => ({
                id: item.imdbID,
                title: item.Title,
                year: parseInt(item.Year) || 0,
                posterUrl: getHighResPoster(item.Poster),
                genre: [item.Type === 'series' ? 'Series' : 'Movie'],
                quality: 'HD',
                type: item.Type,
                rating: 'N/A',
                duration: 'N/A',
                synopsis: '',
                backdropUrl: getHighResPoster(item.Poster),
                cast: []
            }));
        }
        return [];
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
};

export const getMovieDetails = async (id: string): Promise<Movie | null> => {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
        const data = await response.json();
        if (data.Response === 'True') {
            return mapOmdbToMovie(data);
        }
        return null;
    } catch (error) {
        console.error("Details Error:", error);
        return null;
    }
};

export const getFeaturedContent = async (): Promise<Movie[]> => {
    try {
        const promises = FEATURED_IDS.map(id => getMovieDetails(id));
        const results = await Promise.all(promises);
        return results.filter(m => m !== null) as Movie[];
    } catch (error) {
        console.error("Featured Fetch Error:", error);
        return [];
    }
};

export const getCollections = () => [
    {
        id: 'c1',
        title: 'The Cinematic Edge',
        description: 'High-contrast visuals and morally ambiguous anti-heroes define this week\'s staff selection.',
        curator: 'Jake Smith',
        themeColor: '#1a1a1a',
        movieIds: ['tt1877830', 'tt1856101', 'tt1160419'], 
        totalRuntime: '12h 45m',
        coverImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop',
        heroCharacterUrl: 'https://pngimg.com/d/batman_PNG48.png'
    },
    {
        id: 'c2',
        title: 'Neon & Chrome',
        description: 'Immerse yourself in the rain-slicked streets of tomorrow. Cybernetics, AI, and the soul of the machine.',
        curator: 'Sarah Connor',
        themeColor: '#c026d3', 
        movieIds: ['tt12566356', 'tt1856101'],
        totalRuntime: '8h 20m',
        coverImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop',
        heroCharacterUrl: 'https://pngimg.com/d/robot_PNG22.png'
    }
];
