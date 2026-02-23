export type MediaType = 'movie' | 'series';

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: string;
  thumbnailUrl: string;
  synopsis: string;
  progress?: number; // 0-100
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  duration: string;
  genre: string[];
  rating: string;
  quality: '4K' | 'HD' | 'CAM';
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  heroUrl?: string; // For the character cutout image
  tagline?: string; // e.g. "DESTINED TO PROTECT"
  trailerUrl?: string; // Optional for preview
  cast: string[];
  director: string;
  matchScore: number; // Mock "Match" percentage
  primaryColor: string; // Hex for the "Adaptive Art Engine"

  // New Fields for Series/Movies Update
  type: MediaType;
  seasons?: Season[];
  downloadOptions?: string[]; // e.g. ['4K', '1080p', '720p']

  // Slider Specifics
  criticReview?: {
    text: string;
    author: string;
  };
  platformLogo?: string; // URL or name of platform (Netflix, HBO, etc)
}

export interface Collection {
  id: string;
  title: string;
  description: string; // Curator's note
  curator: string;
  themeColor: string; // Hex for aesthetic
  movieIds: string[]; // IDs mapping to MOCK_MOVIES
  totalRuntime: string;
  coverImage: string; // For the collage background
  heroCharacterUrl?: string; // For the layered effect
}



export type ViewState = 'HOME' | 'PLAYER' | 'SEARCH';
