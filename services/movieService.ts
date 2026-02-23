import { Movie, Collection } from '../types';

const API_KEY = '4ba2f2d6';
const BASE_URL = 'https://www.omdbapi.com/';

// ─── Hero Slider: Fresh 2024/2025 blockbusters ────────────────────────────────
const HERO_IDS = [
    'tt21807222', // Deadpool & Wolverine (2024)
    'tt15239678', // Dune: Part Two (2024)
    'tt22022452', // Alien: Romulus (2024)
    'tt3224458',  // Furiosa: A Mad Max Saga (2024)
    'tt6263850',  // Inside Out 2 (2024)
    'tt12637874', // The Wild Robot (2024)
    'tt5090568',  // Wicked (2024)
    'tt14230458', // Godzilla x Kong: The New Empire (2024)
];

// ─── New Releases: 2023–2025 titles ──────────────────────────────────────────
const NEW_RELEASE_IDS = [
    'tt21807222', // Deadpool & Wolverine (2024)
    'tt15239678', // Dune: Part Two (2024)
    'tt22022452', // Alien: Romulus (2024)
    'tt3224458',  // Furiosa: A Mad Max Saga (2024)
    'tt6263850',  // Inside Out 2 (2024)
    'tt12637874', // The Wild Robot (2024)
    'tt5090568',  // Wicked (2024)
    'tt14230458', // Godzilla x Kong: The New Empire (2024)
    'tt13869136', // Monkey Man (2024)
    'tt15671028', // Kingdom of the Planet of the Apes (2024)
    'tt13444912', // Civil War (2024)
    'tt11286314', // Twisters (2024)
    'tt11813216', // The Creator (2023)
    'tt9362722',  // Spider-Man: Across the Spider-Verse (2023)
    'tt9114286',  // Everything Everywhere All at Once (2022)
    'tt8111088',  // The Last of Us (2023)
    'tt7366338',  // Chernobyl (2019 — prestige)
];

// ─── Featured Library: broad genre coverage ───────────────────────────────────
const FEATURED_IDS = [
    // Action / Superhero
    'tt1877830',  // The Batman
    'tt4154796',  // Avengers: Endgame
    'tt10872600', // Spider-Man: No Way Home
    'tt6791350',  // Guardians of the Galaxy Vol. 3
    'tt13162662', // Black Panther: Wakanda Forever
    // Sci-Fi / Fantasy
    'tt1160419',  // Dune
    'tt0816692',  // Interstellar
    'tt1856101',  // Blade Runner 2049
    'tt0133093',  // The Matrix
    // Animation / Series
    'tt12566356', // Cyberpunk: Edgerunners
    'tt11126994', // Arcane
    'tt6723592',  // Demon Slayer
    // Prestige TV
    'tt5180504',  // The Witcher
    'tt0944947',  // Game of Thrones
    'tt1520211',  // The Walking Dead
    // Thriller / Crime
    'tt2582782',  // Whiplash
    'tt1375666',  // Inception
    'tt0110912',  // Pulp Fiction
    // Drama / Award Winners
    'tt3228774',  // Bohemian Rhapsody
    'tt6751668',  // Parasite
    'tt7286456',  // Joker
    'tt9032400',  // Eternals
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

const getHighResPoster = (url: string) => {
    if (!url || url === 'N/A')
        return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop';
    return url.replace(/._V1_.*\.jpg$/g, '.jpg');
};

const mapOmdbToMovie = (data: any): Movie => {
    const isSeries = data.Type === 'series';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.8';
    const poster = getHighResPoster(data.Poster);

    let tagline = 'Cinematic Masterpiece';
    if (data.Awards && data.Awards !== 'N/A' && data.Awards.length > 10) {
        tagline = data.Awards;
    } else if (data.Plot && data.Plot.length < 50) {
        tagline = data.Plot;
    }

    const genres = data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : ['Cinema'];

    return {
        id: data.imdbID,
        title: data.Title,
        year: parseInt(data.Year) || new Date().getFullYear(),
        duration: data.Runtime !== 'N/A' ? data.Runtime : 'Unknown',
        genre: genres,
        rating: rating,
        quality: parseFloat(rating) >= 7.5 ? '4K' : 'HD',
        synopsis: data.Plot !== 'N/A' ? data.Plot : 'No synopsis available for this title.',
        posterUrl: poster,
        backdropUrl: poster,
        heroUrl: poster,
        tagline: tagline.toUpperCase(),
        cast: data.Actors ? data.Actors.split(', ') : [],
        director: data.Director !== 'N/A' ? data.Director : 'Unknown Director',
        matchScore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : 85,
        primaryColor: '#1a1a1a',
        type: isSeries ? 'series' : 'movie',
        seasons: isSeries ? [
            {
                id: 's1',
                number: 1,
                episodes: Array.from({ length: 8 }).map((_, i) => ({
                    id: `ep-${i}`,
                    number: i + 1,
                    title: `Chapter ${i + 1}`,
                    duration: '45m',
                    thumbnailUrl: poster,
                    synopsis: data.Plot
                }))
            }
        ] : undefined,
        downloadOptions: ['4K', '1080p', '720p'],
        criticReview: {
            text: data.Plot && data.Plot !== 'N/A' ? data.Plot : 'A visual spectacle that redefines the genre.',
            author: "Critic's Choice"
        },
        platformLogo: 'OMDb STREAM'
    };
};

// ─── API Methods ──────────────────────────────────────────────────────────────

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
        console.error('Search Error:', error);
        return [];
    }
};

export const getMovieDetails = async (id: string): Promise<Movie | null> => {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
        const data = await response.json();
        if (data.Response === 'True') return mapOmdbToMovie(data);
        return null;
    } catch (error) {
        console.error('Details Error:', error);
        return null;
    }
};

// Fetch all featured library movies (home grid)
export const getFeaturedContent = async (): Promise<Movie[]> => {
    try {
        const results = await Promise.all(FEATURED_IDS.map(id => getMovieDetails(id)));
        return results.filter(m => m !== null) as Movie[];
    } catch (error) {
        console.error('Featured Fetch Error:', error);
        return [];
    }
};

// Fetch hero slider movies (2024/2025 blockbusters)
export const getHeroContent = async (): Promise<Movie[]> => {
    try {
        const results = await Promise.all(HERO_IDS.map(id => getMovieDetails(id)));
        return results.filter(m => m !== null) as Movie[];
    } catch (error) {
        console.error('Hero Fetch Error:', error);
        return [];
    }
};

// Fetch new releases (2023–2025)
export const getNewReleases = async (): Promise<Movie[]> => {
    try {
        const results = await Promise.all(NEW_RELEASE_IDS.map(id => getMovieDetails(id)));
        return results.filter(m => m !== null) as Movie[];
    } catch (error) {
        console.error('New Releases Fetch Error:', error);
        return [];
    }
};

export const getCollections = (): Collection[] => [
    {
        id: 'c1',
        title: 'The Cinematic Edge',
        description: "High-contrast visuals and morally ambiguous anti-heroes define this week's staff selection.",
        curator: 'Jake Smith',
        themeColor: '#1a1a1a',
        movieIds: ['tt1877830', 'tt1856101', 'tt1160419', 'tt7286456'],
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
        movieIds: ['tt12566356', 'tt1856101', 'tt0133093', 'tt11126994'],
        totalRuntime: '8h 20m',
        coverImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop',
        heroCharacterUrl: 'https://pngimg.com/d/robot_PNG22.png'
    },
    {
        id: 'c3',
        title: 'Award Season',
        description: 'The films critics and Academy voters obsessed over — bold, challenging, and unforgettable.',
        curator: 'Emma Fields',
        themeColor: '#d97706',
        movieIds: ['tt6751668', 'tt9114286', 'tt2582782', 'tt3228774'],
        totalRuntime: '9h 15m',
        coverImage: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=2070&auto=format&fit=crop',
        heroCharacterUrl: ''
    },
    {
        id: 'c4',
        title: '2024 Blockbusters',
        description: 'The biggest releases of 2024 — from summer spectacles to awards season heavyweights.',
        curator: 'CineFlow Editorial',
        themeColor: '#16a34a',
        movieIds: ['tt21807222', 'tt15239678', 'tt22022452', 'tt3224458', 'tt6263850'],
        totalRuntime: '10h 30m',
        coverImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop',
        heroCharacterUrl: ''
    }
];
