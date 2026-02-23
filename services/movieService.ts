import { Movie, Season, Collection } from '../types';

const API_KEY = '4ba2f2d6';
const BASE_URL = 'https://www.omdbapi.com/';

// --- ID Lists for Curated Experience ---
const FEATURED_IDS = [
    'tt1877830', // The Batman
    'tt1160419', // Dune
    'tt12566356', // Cyberpunk: Edgerunners
    'tt0816692', // Interstellar
    'tt5180504', // The Witcher
    'tt9362722', // Spider-Man: Across the Spider-Verse
    'tt11126994', // Arcane
    'tt1856101', // Blade Runner 2049
];

// --- In-Memory Cache to avoid redundant API calls ---
const _cache = new Map<string, Movie>();

// --- Helper: generate season data for fallback series ---
const makeSeason = (
    seasonNum: number,
    episodeCount: number,
    episodeTitles: string[],
    thumbUrl: string,
    duration: string = '45m'
) => ({
    id: `s${seasonNum}`,
    number: seasonNum,
    episodes: Array.from({ length: episodeCount }).map((_, i) => ({
        id: `s${seasonNum}ep${i + 1}`,
        number: i + 1,
        title: episodeTitles[i] ?? `Episode ${i + 1}`,
        duration,
        thumbnailUrl: thumbUrl,
        synopsis: ''
    }))
});

// --- Instant Fallback Catalogue (renders before API responds) ---
// Uses small, fast-loading Unsplash images optimised for mobile (w=600).
const FALLBACK_MOVIES: Movie[] = [
    {
        id: 'tt1877830', title: 'The Batman', year: 2022, duration: '176 min',
        genre: ['Action', 'Crime', 'Drama'], rating: '7.8', quality: '4K',
        synopsis: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the citys hidden corruption.',
        posterUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=60&w=600&auto=format&fit=crop',
        tagline: 'VENGEANCE', cast: ['Robert Pattinson', 'Zo├½ Kravitz'], director: 'Matt Reeves',
        matchScore: 85, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A brooding, visually stunning detective thriller.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt1160419', title: 'Dune', year: 2021, duration: '155 min',
        genre: ['Action', 'Adventure', 'Drama'], rating: '8.0', quality: '4K',
        synopsis: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=60&w=600&auto=format&fit=crop',
        tagline: 'BEGIN THE JOURNEY', cast: ['Timoth├⌐e Chalamet', 'Zendaya'], director: 'Denis Villeneuve',
        matchScore: 90, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A visually spectacular epic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt12566356', title: 'Cyberpunk: Edgerunners', year: 2022, duration: '25 min',
        genre: ['Animation', 'Action', 'Drama'], rating: '8.3', quality: '4K',
        synopsis: 'A street kid tries to survive in a technology and body modification-obsessed city of the future.',
        posterUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=60&w=600&auto=format&fit=crop',
        tagline: 'LIVE FAST', cast: ['Zach Aguilar', 'Emily Rudd'], director: 'Hiroyuki Imaishi',
        matchScore: 88, primaryColor: '#1a1a1a', type: 'series',
        downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 10, [
                'Let You Down', 'Like a Comet', 'Smooth Criminal', 'Lucky You',
                'All Eyez on Me', 'Girl on Fire', 'Stronger', 'Stay', 'Last Stop This Town', 'My Moon My Man'
            ], 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=60&w=600&auto=format&fit=crop', '25m'),
        ],
        criticReview: { text: 'A neon-soaked masterpiece.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt0816692', title: 'Interstellar', year: 2014, duration: '169 min',
        genre: ['Adventure', 'Drama', 'Sci-Fi'], rating: '8.7', quality: '4K',
        synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=60&w=600&auto=format&fit=crop',
        tagline: 'MANKIND WAS BORN ON EARTH', cast: ['Matthew McConaughey', 'Anne Hathaway'], director: 'Christopher Nolan',
        matchScore: 95, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'An ambitious, mind-bending odyssey.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt5180504', title: 'The Witcher', year: 2019, duration: '60 min',
        genre: ['Action', 'Adventure', 'Fantasy'], rating: '8.2', quality: 'HD',
        synopsis: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
        posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=600&auto=format&fit=crop',
        tagline: 'EVIL IS EVIL', cast: ['Henry Cavill', 'Anya Chalotra'], director: 'Lauren Schmidt Hissrich',
        matchScore: 82, primaryColor: '#1a1a1a', type: 'series', downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 8, [
                'The End\'s Beginning', 'Four Marks', 'Betrayer Moon', 'Of Banquets, Bastards and Burials',
                'Bottled Appetites', 'Rare Species', 'Before a Fall', 'Much More'
            ], 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=600&auto=format&fit=crop', '60m'),
            makeSeason(2, 8, [
                'A Grain of Truth', 'Kaer Morhen', 'What Is Lost', 'Redanian Intelligence',
                'Turn Your Back', 'Dear Friend...', 'Voleth Meir', 'Family'
            ], 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=600&auto=format&fit=crop', '60m'),
        ],
        criticReview: { text: 'A binge-worthy fantasy epic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt9362722', title: 'Spider-Man: Across the Spider-Verse', year: 2023, duration: '140 min',
        genre: ['Animation', 'Action', 'Adventure'], rating: '8.7', quality: '4K',
        synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=60&w=600&auto=format&fit=crop',
        tagline: 'BEYOND AMAZING', cast: ['Shameik Moore', 'Hailee Steinfeld'], director: 'Joaquim Dos Santos',
        matchScore: 92, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'Genre-defining animated filmmaking.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt11126994', title: 'Arcane', year: 2021, duration: '40 min',
        genre: ['Animation', 'Action', 'Adventure'], rating: '9.0', quality: '4K',
        synopsis: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League of Legends champions.',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=60&w=600&auto=format&fit=crop',
        tagline: 'EVERY LEGEND HAS A BEGINNING', cast: ['Hailee Steinfeld', 'Ella Purnell'], director: 'Christian Linke',
        matchScore: 94, primaryColor: '#1a1a1a', type: 'series', downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 9, [
                'Welcome to the Playground', 'Some Mysteries Are Better Left Unsolved', 'The Base Violence Necessary for Change',
                'Happy Progress Day!', 'Everybody Wants to Be My Enemy', 'When These Walls Come Tumbling Down',
                'The Boy Savior', 'Oil and Water', 'The Monster You Created'
            ], 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=60&w=600&auto=format&fit=crop', '40m'),
            makeSeason(2, 9, [
                'Heavy Is the Crown', 'A Slow Spiral', 'Left Right Wrong', 'Vi Vis Vis',
                'Become the Flame', 'The Message', 'Pretend Like It\'s the First Time',
                'Killing Is Easy', 'The Dirt Under Your Nails'
            ], 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=60&w=600&auto=format&fit=crop', '40m'),
        ],
        criticReview: { text: 'The best animated series ever made.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt1856101', title: 'Blade Runner 2049', year: 2017, duration: '164 min',
        genre: ['Drama', 'Mystery', 'Sci-Fi'], rating: '8.0', quality: '4K',
        synopsis: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.',
        posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=60&w=600&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=60&w=600&auto=format&fit=crop',
        heroUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=60&w=600&auto=format&fit=crop',
        tagline: 'THE FUTURE OF LAW ENFORCEMENT', cast: ['Ryan Gosling', 'Harrison Ford'], director: 'Denis Villeneuve',
        matchScore: 87, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A breathtaking sequel to a sci-fi classic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
];
// Populate cache with fallback data immediately
FALLBACK_MOVIES.forEach(m => _cache.set(m.id, m));

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
    // Return cached version immediately if available
    if (_cache.has(id)) return _cache.get(id)!;
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
        const data = await response.json();
        if (data.Response === 'True') {
            const movie = mapOmdbToMovie(data);
            _cache.set(id, movie);
            return movie;
        }
        return null;
    } catch (error) {
        console.error("Details Error:", error);
        return null;
    }
};

/**
 * Returns the fallback catalogue instantly (zero wait), then fetches real
 * OMDb data in the background. When each real result arrives, onUpdate is
 * called with the full updated list so the UI can re-render incrementally.
 */
export const getFeaturedContent = async (
    onUpdate?: (movies: Movie[]) => void
): Promise<Movie[]> => {
    // Return fallback immediately so the UI renders without waiting for the network
    const snapshot = [...FALLBACK_MOVIES];

    // Kick off background hydration ΓÇö don't await this
    (async () => {
        try {
            let hydrated = [...snapshot];
            const promises = FEATURED_IDS.map(async (id) => {
                try {
                    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
                    const data = await response.json();
                    if (data.Response === 'True') {
                        const movie = mapOmdbToMovie(data);
                        _cache.set(id, movie);
                        // Replace the fallback entry in our hydrated list
                        hydrated = hydrated.map(m => m.id === id ? movie : m);
                        onUpdate?.([...hydrated]);
                    }
                } catch (_) { /* keep fallback */ }
            });
            await Promise.all(promises);
        } catch (e) {
            console.error("Background hydration error:", e);
        }
    })();

    return snapshot;
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
