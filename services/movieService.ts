import { Movie, Season, Collection } from '../types';

// --- API Key Rotation (round-robin to avoid rate limits) ---
const API_KEYS = ['4ba2f2d6', 'f6bca86f'];
let _keyIndex = 0;
const getApiKey = () => {
    const key = API_KEYS[_keyIndex % API_KEYS.length];
    _keyIndex++;
    return key;
};
const BASE_URL = 'https://www.omdbapi.com/';

// TMDB backdrop base (no API key needed for image CDN)
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const backdrop = (path: string) => `${TMDB_IMG}/original${path}`;

// --- ID Lists for Curated Experience ---
const FEATURED_IDS = [
    // Classics & acclaimed
    'tt1877830', // The Batman (2022)
    'tt1160419', // Dune: Part One (2021)
    'tt12566356', // Cyberpunk: Edgerunners (2022)
    'tt0816692', // Interstellar (2014)
    'tt5180504', // The Witcher (2019)
    'tt9362722', // Spider-Man: Across the Spider-Verse (2023)
    'tt11126994', // Arcane (2021)
    'tt1856101', // Blade Runner 2049 (2017)
    // 2023 Releases
    'tt15398776', // Oppenheimer (2023)
    'tt3228774',  // Barbie (2023)
    'tt14269590', // The Creator (2023)
    'tt9663764',  // Aquaman and the Lost Kingdom (2023)
    'tt21807272', // Rebel Moon (2023)
    'tt1630029',  // Avatar: The Way of Water (2022)
    'tt15239678', // Dune: Part Two (2024)
    // 2024 Releases
    'tt5109280',  // Godzilla x Kong: The New Empire (2024)
    'tt12037194', // Furiosa: A Mad Max Saga (2024)
    'tt11389872', // Kingdom of the Planet of the Apes (2024)
    'tt6263850',  // Deadpool & Wolverine (2024)
    'tt18412256', // Alien: Romulus (2024)
    'tt22022452', // Twisters (2024)
    'tt8041270',  // Transformers One (2024)
    'tt13622970', // Moana 2 (2024)
    'tt12584954', // Inside Out 2 (2024)
    'tt21823606', // Kraven the Hunter (2024)
    // 2025 Releases
    'tt11304740', // Captain America: Brave New World (2025)
    'tt6263850',  // Thunderbolts (2025) — placeholder, reuse slot
    'tt20969586', // Mickey 17 (2025)
    'tt10954600', // Avengers: Doomsday (2025)
    'tt21692408', // Jurassic World Rebirth (2025)
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

// --- Shuffle helper (Fisher-Yates) ---
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// --- Instant Fallback Catalogue ---
// Poster URLs: real Amazon CDN links from OMDb API (no key needed to load images).
// Backdrop URLs: TMDB image CDN (no API key needed for image serving).
const AMZ = (path: string) => `https://m.media-amazon.com/images/M/${path}.jpg`;

const FALLBACK_MOVIES_RAW: Movie[] = [
    {
        id: 'tt1877830', title: 'The Batman', year: 2022, duration: '176 min',
        genre: ['Action', 'Crime', 'Drama'], rating: '7.8', quality: '4K',
        synopsis: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption and his family\'s dark secrets.',
        posterUrl: AMZ('MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'),
        heroUrl: backdrop('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'),
        tagline: 'VENGEANCE', cast: ['Robert Pattinson', 'Zoë Kravitz'], director: 'Matt Reeves',
        matchScore: 85, primaryColor: '#1a1a2e', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A brooding, visually stunning detective thriller.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt1160419', title: 'Dune: Part One', year: 2021, duration: '155 min',
        genre: ['Action', 'Adventure', 'Sci-Fi'], rating: '8.0', quality: '4K',
        synopsis: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.',
        posterUrl: AMZ('MV5BNWIyNmU5MGYtZDZmNi00ZjAwLWJlYjgtZTc0ZGIxMDE4ZGYwXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/6P6N9KDHMFQ9GWB3KtEBXagf9OH.jpg'),
        heroUrl: backdrop('/6P6N9KDHMFQ9GWB3KtEBXagf9OH.jpg'),
        tagline: 'BEGIN THE JOURNEY', cast: ['Timothée Chalamet', 'Zendaya'], director: 'Denis Villeneuve',
        matchScore: 90, primaryColor: '#8B6914', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A visually spectacular epic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt12566356', title: 'Cyberpunk: Edgerunners', year: 2022, duration: '25 min',
        genre: ['Animation', 'Action', 'Drama'], rating: '8.3', quality: '4K',
        synopsis: 'A street kid tries to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he stays alive by becoming an Edgerunner.',
        posterUrl: AMZ('MV5BYjEzM2MzMTYtNGFjYy00M2YwLWJhNmItMTdmZDczM2RmNDliXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/fAuBHvQRR1ArHiF82xBBjysJmD3.jpg'),
        heroUrl: backdrop('/fAuBHvQRR1ArHiF82xBBjysJmD3.jpg'),
        tagline: 'LIVE FAST, DIE CHROME', cast: ['Zach Aguilar', 'Emily Rudd'], director: 'Hiroyuki Imaishi',
        matchScore: 88, primaryColor: '#c026d3', type: 'series',
        downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 10, [
                'Let You Down', 'Like a Comet', 'Smooth Criminal', 'Lucky You',
                'All Eyez on Me', 'Girl on Fire', 'Stronger', 'Stay', 'Last Stop This Town', 'My Moon My Man'
            ], AMZ('MV5BYjEzM2MzMTYtNGFjYy00M2YwLWJhNmItMTdmZDczM2RmNDliXkEyXkFqcGc@._V1_SX1000'), '25m'),
        ],
        criticReview: { text: 'A neon-soaked masterpiece.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt0816692', title: 'Interstellar', year: 2014, duration: '169 min',
        genre: ['Adventure', 'Drama', 'Sci-Fi'], rating: '8.7', quality: '4K',
        synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        posterUrl: AMZ('MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg'),
        heroUrl: backdrop('/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg'),
        tagline: 'MANKIND WAS BORN ON EARTH. IT WAS NEVER MEANT TO DIE HERE.',
        cast: ['Matthew McConaughey', 'Anne Hathaway'], director: 'Christopher Nolan',
        matchScore: 95, primaryColor: '#1a1a1a', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'An ambitious, mind-bending odyssey.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt5180504', title: 'The Witcher', year: 2019, duration: '60 min',
        genre: ['Action', 'Adventure', 'Fantasy'], rating: '8.2', quality: 'HD',
        synopsis: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
        posterUrl: AMZ('MV5BOTQzMzNmMzUtODgwNS00YTdhLTg5N2MtOWU1YTc4YWY3NjRlXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/jBJWaqoSCiARWtfV0GlqHrcdidd.jpg'),
        heroUrl: backdrop('/jBJWaqoSCiARWtfV0GlqHrcdidd.jpg'),
        tagline: 'EVIL IS EVIL. LESSER, GREATER, MIDDLING.',
        cast: ['Henry Cavill', 'Anya Chalotra'], director: 'Lauren Schmidt Hissrich',
        matchScore: 82, primaryColor: '#2d1b0e', type: 'series', downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 8, [
                'The End\'s Beginning', 'Four Marks', 'Betrayer Moon', 'Of Banquets, Bastards and Burials',
                'Bottled Appetites', 'Rare Species', 'Before a Fall', 'Much More'
            ], AMZ('MV5BOTQzMzNmMzUtODgwNS00YTdhLTg5N2MtOWU1YTc4YWY3NjRlXkEyXkFqcGc@._V1_SX1000'), '60m'),
            makeSeason(2, 8, [
                'A Grain of Truth', 'Kaer Morhen', 'What Is Lost', 'Redanian Intelligence',
                'Turn Your Back', 'Dear Friend...', 'Voleth Meir', 'Family'
            ], AMZ('MV5BOTQzMzNmMzUtODgwNS00YTdhLTg5N2MtOWU1YTc4YWY3NjRlXkEyXkFqcGc@._V1_SX1000'), '60m'),
        ],
        criticReview: { text: 'A binge-worthy fantasy epic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt9362722', title: 'Spider-Man: Across the Spider-Verse', year: 2023, duration: '140 min',
        genre: ['Animation', 'Action', 'Adventure'], rating: '8.7', quality: '4K',
        synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        posterUrl: AMZ('MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'),
        heroUrl: backdrop('/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'),
        tagline: 'BEYOND AMAZING', cast: ['Shameik Moore', 'Hailee Steinfeld'], director: 'Joaquim Dos Santos',
        matchScore: 92, primaryColor: '#e11d48', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'Genre-defining animated filmmaking.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt11126994', title: 'Arcane', year: 2021, duration: '40 min',
        genre: ['Animation', 'Action', 'Adventure'], rating: '9.0', quality: '4K',
        synopsis: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League of Legends champions—and the power that will tear them apart.',
        posterUrl: AMZ('MV5BYjA2NzhlMDItNWRmZC00MzRjLWE3ZjAtZjBlZDAwOWY2ODdjXkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg'),
        heroUrl: backdrop('/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg'),
        tagline: 'EVERY LEGEND HAS A BEGINNING', cast: ['Hailee Steinfeld', 'Ella Purnell'], director: 'Christian Linke',
        matchScore: 94, primaryColor: '#7c3aed', type: 'series', downloadOptions: ['4K', '1080p', '720p'],
        seasons: [
            makeSeason(1, 9, [
                'Welcome to the Playground', 'Some Mysteries Are Better Left Unsolved', 'The Base Violence Necessary for Change',
                'Happy Progress Day!', 'Everybody Wants to Be My Enemy', 'When These Walls Come Tumbling Down',
                'The Boy Savior', 'Oil and Water', 'The Monster You Created'
            ], AMZ('MV5BYjA2NzhlMDItNWRmZC00MzRjLWE3ZjAtZjBlZDAwOWY2ODdjXkEyXkFqcGc@._V1_SX1000'), '40m'),
            makeSeason(2, 9, [
                'Heavy Is the Crown', 'A Slow Spiral', 'Left Right Wrong', 'Vi Vis Vis',
                'Become the Flame', 'The Message', 'Pretend Like It\'s the First Time',
                'Killing Is Easy', 'The Dirt Under Your Nails'
            ], AMZ('MV5BYjA2NzhlMDItNWRmZC00MzRjLWE3ZjAtZjBlZDAwOWY2ODdjXkEyXkFqcGc@._V1_SX1000'), '40m'),
        ],
        criticReview: { text: 'The best animated series ever made.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt1856101', title: 'Blade Runner 2049', year: 2017, duration: '164 min',
        genre: ['Drama', 'Mystery', 'Sci-Fi'], rating: '8.0', quality: '4K',
        synopsis: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for thirty years.',
        posterUrl: AMZ('MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX1000'),
        backdropUrl: backdrop('/ilRyazdMJwN05exqhwK2RCZURtQ.jpg'),
        heroUrl: backdrop('/ilRyazdMJwN05exqhwK2RCZURtQ.jpg'),
        tagline: 'THE FUTURE OF LAW ENFORCEMENT', cast: ['Ryan Gosling', 'Harrison Ford'], director: 'Denis Villeneuve',
        matchScore: 87, primaryColor: '#b45309', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A breathtaking sequel to a sci-fi classic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    // ── New 2023–2024 entries (real Amazon CDN poster URLs) ──────────────────
    {
        id: 'tt15398776', title: 'Oppenheimer', year: 2023, duration: '180 min',
        genre: ['Biography', 'Drama', 'History'], rating: '8.9', quality: '4K',
        synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        posterUrl: AMZ('MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/fm6KqXpk3M2HVlu3lQzbCYKxIQq.jpg'),
        heroUrl: backdrop('/fm6KqXpk3M2HVlu3lQzbCYKxIQq.jpg'),
        tagline: 'THE WORLD FOREVER CHANGES', cast: ['Cillian Murphy', 'Emily Blunt'], director: 'Christopher Nolan',
        matchScore: 92, primaryColor: '#b45309', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A monumental cinematic achievement.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt12037194', title: 'Furiosa: A Mad Max Saga', year: 2024, duration: '148 min',
        genre: ['Action', 'Adventure', 'Sci-Fi'], rating: '7.8', quality: '4K',
        synopsis: 'The origin story of renegade warrior Furiosa before she teamed up with Mad Max in a savage world.',
        posterUrl: AMZ('MV5BNTcwYWE1NTYtOWNiYy00NzY3LWIwY2MtNjJmZDkxNDNmOWE1XkEyXkFqcGc@._V1_SX1000'),
        backdropUrl: backdrop('/bpKIckKQ7BKOF3MLCoCp0vjqPBV.jpg'),
        heroUrl: backdrop('/bpKIckKQ7BKOF3MLCoCp0vjqPBV.jpg'),
        tagline: 'WITNESS HER', cast: ['Anya Taylor-Joy', 'Chris Hemsworth'], director: 'George Miller',
        matchScore: 86, primaryColor: '#7c3aed', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A thunderous, visually stunning action epic.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
    {
        id: 'tt6263850', title: 'Deadpool & Wolverine', year: 2024, duration: '127 min',
        genre: ['Action', 'Comedy', 'Superhero'], rating: '7.8', quality: '4K',
        synopsis: 'Deadpool is forced to work with Wolverine to stop a threat that could unravel the Marvel multiverse.',
        posterUrl: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        backdropUrl: backdrop('/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg'),
        heroUrl: backdrop('/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg'),
        tagline: 'SAVE THE UNIVERSE', cast: ['Ryan Reynolds', 'Hugh Jackman'], director: 'Shawn Levy',
        matchScore: 88, primaryColor: '#e11d48', type: 'movie', downloadOptions: ['4K', '1080p', '720p'],
        criticReview: { text: 'A wildly entertaining superhero romp.', author: "Critic's Choice" },
        platformLogo: 'OMDb STREAM'
    },
];

// Shuffle on each page load so the hero always rotates
const FALLBACK_MOVIES: Movie[] = shuffleArray(FALLBACK_MOVIES_RAW);

// Populate cache with fallback data immediately
FALLBACK_MOVIES.forEach(m => _cache.set(m.id, m));

// Track whether we've already done the background hydration this session
let _hydratedOnce = false;
// The full live catalogue (grows as OMDb responds)
let _liveCatalogue: Movie[] = [...FALLBACK_MOVIES];

// --- Helper Functions ---

// Fallback: inline SVG so it never makes a network request and never breaks
const PLACEHOLDER_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='400' height='600' fill='%2318181b'/%3E%3Crect x='140' y='220' width='120' height='120' rx='60' fill='%2327272a'/%3E%3Ctext x='200' y='285' text-anchor='middle' font-size='52' fill='%2352525b'%3E%F0%9F%8E%AC%3C/text%3E%3Ctext x='200' y='380' text-anchor='middle' font-size='13' fill='%2352525b' font-family='Inter,sans-serif'%3EComing Soon%3C/text%3E%3C/svg%3E";

const getHighResPoster = (url: string) => {
    if (!url || url === 'N/A') return PLACEHOLDER_POSTER;
    // Strip OMDb resize suffix (e.g. ._V1_SX300.jpg) to get the full-res Amazon CDN image
    return url.replace(/\._V1_.*\.jpg$/g, '.jpg');
};

const mapOmdbToMovie = (data: any): Movie => {
    const isSeries = data.Type === 'series';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.8';
    const omdbPoster = getHighResPoster(data.Poster);

    let tagline = "Cinematic Masterpiece";
    if (data.Awards && data.Awards !== 'N/A' && data.Awards.length > 10) {
        tagline = data.Awards;
    } else if (data.Plot && data.Plot.length < 50) {
        tagline = data.Plot;
    }

    const genres = data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ') : ['Cinema'];

    // Preserve the TMDB cinematic backdrop from the fallback entry if already cached
    const existingEntry = _cache.get(data.imdbID);
    const heroBackdrop = existingEntry?.heroUrl ?? omdbPoster;
    const wideBackdrop = existingEntry?.backdropUrl ?? omdbPoster;

    return {
        id: data.imdbID,
        title: data.Title,
        year: parseInt(data.Year) || new Date().getFullYear(),
        duration: data.Runtime !== 'N/A' ? data.Runtime : 'Unknown',
        genre: genres,
        rating: rating,
        quality: parseFloat(rating) >= 7.5 ? '4K' : 'HD',
        synopsis: data.Plot !== 'N/A' ? data.Plot : 'No synopsis available for this title.',
        posterUrl: omdbPoster,
        backdropUrl: wideBackdrop,
        heroUrl: heroBackdrop,
        tagline: tagline.toUpperCase(),
        cast: data.Actors ? data.Actors.split(', ') : [],
        director: data.Director !== 'N/A' ? data.Director : 'Unknown Director',
        matchScore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : 85,
        primaryColor: existingEntry?.primaryColor ?? '#1a1a1a',
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
                    thumbnailUrl: omdbPoster,
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
        const response = await fetch(`${BASE_URL}?apikey=${getApiKey()}&s=${encodeURIComponent(query)}`);
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
    if (_cache.has(id)) return _cache.get(id)!;
    try {
        const response = await fetch(`${BASE_URL}?apikey=${getApiKey()}&i=${id}&plot=full`);
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
 * OMDb data in the background. When each result arrives, onUpdate is called
 * with the full updated list so the UI can re-render incrementally.
 */
export const getFeaturedContent = async (
    onUpdate?: (movies: Movie[]) => void
): Promise<Movie[]> => {
    // Always return the current live catalogue immediately (already has fallbacks)
    if (_hydratedOnce) {
        // Shuffle the catalogue so the Hero sees a different order each visit
        const shuffled = shuffleArray(_liveCatalogue);
        onUpdate?.(shuffled);
        return shuffled;
    }

    const snapshot = [...FALLBACK_MOVIES];

    (async () => {
        try {
            // Deduplicate FEATURED_IDS
            const uniqueIds = [...new Set(FEATURED_IDS)];
            const promises = uniqueIds.map(async (id) => {
                try {
                    const response = await fetch(`${BASE_URL}?apikey=${getApiKey()}&i=${id}&plot=full`);
                    const data = await response.json();
                    if (data.Response === 'True') {
                        const movie = mapOmdbToMovie(data);
                        _cache.set(id, movie);
                        // Add or replace in the live catalogue
                        const existsIdx = _liveCatalogue.findIndex(m => m.id === id);
                        if (existsIdx >= 0) {
                            _liveCatalogue = _liveCatalogue.map(m => m.id === id ? movie : m);
                        } else {
                            _liveCatalogue = [..._liveCatalogue, movie];
                        }
                        // Notify UI with shuffled result so Hero rotates differently each call
                        onUpdate?.(shuffleArray([..._liveCatalogue]));
                    }
                } catch (_) { /* keep fallback for this ID */ }
            });
            await Promise.all(promises);
            _hydratedOnce = true;
        } catch (e) {
            console.error('Background hydration error:', e);
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
        coverImage: backdrop('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'),  // The Batman
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
        coverImage: backdrop('/ilRyazdMJwN05exqhwK2RCZURtQ.jpg'),  // Blade Runner 2049
        heroCharacterUrl: 'https://pngimg.com/d/robot_PNG22.png'
    }
];
