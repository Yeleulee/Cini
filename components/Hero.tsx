import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { Movie } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

export const Hero: React.FC<HeroProps> = ({ movies, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    // Only auto-play if we have movies
    if (movies.length > 1) {
        const timer = setInterval(() => {
          nextSlide();
        }, 8000);
        return () => clearInterval(timer);
    }
  }, [currentIndex, movies.length]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (movies.length === 0) return null;
  const movie = movies[currentIndex];

  // Logic to split synopsis for the "Review" visual style in the screenshot
  // "When a sadistic serial killer..."
  const synopsisPreview = movie.synopsis.length > 150 
    ? movie.synopsis.substring(0, 150) + "..." 
    : movie.synopsis;

  // Animation Variants
  // Fixed: Added explicit Variants type and used 'as const' for easing to prevent type mismatch
  const slideVariants: Variants = {
    enter: (direction: number) => ({
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      zIndex: 1,
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.8 },
        scale: { duration: 1.2, ease: "easeOut" as const }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      opacity: 0,
      scale: 1,
      transition: {
        opacity: { duration: 0.8 }
      }
    })
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#09090b] text-white font-sans">
      
      {/* --- Slider Background Layer --- */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
            key={movie.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
        >
            {/* High Res Background */}
            <div 
                className="absolute inset-0 bg-cover bg-top"
                style={{ backgroundImage: `url(${movie.backdropUrl})` }} 
            />
            
            {/* Cinematic Gradient Overlays to match the screenshot dark/gold mood */}
            {/* Left side darkening for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            {/* Bottom darkening */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/30" />
            
            {/* Gold Glow Accent (Top Left) */}
            <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-yellow-600/10 blur-[150px] mix-blend-screen pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* --- Main Content Layer --- */}
      <div className="absolute inset-0 z-20 px-6 md:px-20 h-full flex flex-col justify-center">
        
        {/* TOP LEFT METADATA PILLS (Matching screenshot "HD 7.8 176 MIN ACTION") */}
        <motion.div 
            key={`meta-${movie.id}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-32 left-6 md:left-20 flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-widest uppercase text-zinc-300"
        >
            <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">
                {movie.quality}
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
                <Star size={10} fill="currentColor" /> {movie.rating}
            </span>
            <span className="text-zinc-400">{movie.duration}</span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full" />
            <span className="text-zinc-300">{movie.genre[0]}</span>
        </motion.div>

        {/* CENTER LEFT: TYPOGRAPHY & REVIEW */}
        <div className="relative w-full max-w-4xl mt-10 z-30">
             
             {/* "Critic's Choice" small label */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 mb-2"
             >
                 <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-yellow-500 font-serif">
                     "
                 </div>
                 <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                     {movie.criticReview?.author || "CRITIC'S CHOICE"}
                 </span>
             </motion.div>

             {/* MAIN TITLE - SERIF - MASSIVE */}
             <motion.h1 
                key={movie.title}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[12vw] md:text-[8vw] font-serif-display font-bold leading-[0.85] text-white tracking-tighter mb-6 mix-blend-overlay"
             >
                {movie.title}
             </motion.h1>

             {/* Description / Review snippet acting as subtext */}
             <motion.div 
                key={`desc-${movie.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col md:flex-row gap-6 max-w-2xl"
             >
                 <p className="text-zinc-300 text-sm md:text-lg font-serif italic leading-relaxed border-l-2 border-yellow-500 pl-4">
                     "{synopsisPreview}"
                 </p>
             </motion.div>

             {/* FOOTER TAGLINE - WIDE SPACING - SCREENSHOT STYLE */}
             <motion.p 
                key={`tag-${movie.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-8 text-xl md:text-2xl text-white/80 font-light tracking-[0.15em] uppercase font-sans"
             >
                {movie.tagline}
             </motion.p>
        </div>

        {/* RIGHT SIDE: CIRCULAR CTA (Simplified to Icon Only) */}
        <div className="absolute right-10 md:right-32 top-1/2 -translate-y-1/2 z-40 hidden md:block">
             <motion.button 
                key={`cta-${movie.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                onClick={() => onPlay(movie)}
                className="group relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105"
             >
                {/* Glassmorphic Background */}
                <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl group-hover:bg-zinc-900/60 transition-colors" />
                
                {/* Content - Play Icon Only */}
                <div className="relative z-10 flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-yellow-500 transition-all duration-300 scale-100 group-hover:scale-110">
                        <Play size={32} className="text-black ml-2" fill="currentColor" />
                    </div>
                </div>

                {/* Optional Orbit Animation ring */}
                <div className="absolute inset-[-10px] border border-white/5 rounded-full" />
             </motion.button>
        </div>

        {/* BOTTOM: THUMBNAILS NAVIGATION */}
        <div className="absolute bottom-10 right-6 md:right-20 left-6 md:left-20 flex items-end justify-between">
            
            {/* Left side empty or social proof, keeping clean as per screenshot focus on text */}
            <div className="hidden md:block"></div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {movies.map((m, idx) => (
                    <motion.div 
                        key={m.id}
                        onClick={() => goToSlide(idx)}
                        className={`relative h-20 w-32 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border ${idx === currentIndex ? 'border-yellow-500 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src={m.posterUrl} className="w-full h-full object-cover" alt="thumb" />
                        {idx === currentIndex && (
                             <div className="absolute inset-0 bg-yellow-500/10" />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
