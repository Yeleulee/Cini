import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

// ─── Image fallback state per slide ───────────────────────────────────────────
interface SlideImg {
  src: string;
  loaded: boolean;
  stage: number; // 0=backdrop 1=heroUrl 2=poster 3=failed
}

function firstSrc(m: Movie) {
  return m.backdropUrl || m.heroUrl || m.posterUrl || '';
}

// ─── Stagger container variants ───────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

// ─── Particle Dust Canvas ─────────────────────────────────────────────────────
// Hex accent → rgba for canvas
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16) || 180;
  const g = parseInt(full.slice(2, 4), 16) || 140;
  const b = parseInt(full.slice(4, 6), 16) || 60;
  return [r, g, b];
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  alpha: number; alphaDir: number;
  life: number; maxLife: number;
}

function makeParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 40,                // start below bottom
    vx: (Math.random() - 0.5) * 0.4,          // gentle horizontal drift
    vy: -(0.3 + Math.random() * 0.7),          // float upward
    radius: 0.8 + Math.random() * 2.2,
    alpha: 0,
    alphaDir: 1,
    life: 0,
    maxLife: 180 + Math.floor(Math.random() * 180),
  };
}

interface DustCanvasProps {
  accent: string;   // hex colour from movie.primaryColor
  active: boolean;  // pause while transitioning
}

const DustCanvas: React.FC<DustCanvasProps> = ({ accent, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const partsRef  = useRef<Particle[]>([]);
  const [rgb]     = useState(() => hexToRgb(accent));

  // Re-derive rgb when accent changes — use a ref so the loop closure stays fresh
  const rgbRef = useRef<[number, number, number]>(hexToRgb(accent));
  useEffect(() => { rgbRef.current = hexToRgb(accent); }, [accent]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const [r, g, b] = rgbRef.current;

    // Spawn new particles to maintain ~80 at any time
    while (partsRef.current.length < 80) {
      partsRef.current.push(makeParticle(W, H));
    }

    partsRef.current = partsRef.current.filter(p => {
      p.life += 1;
      p.x += p.vx;
      p.y += p.vy;

      // Fade in for first 40 frames, fade out for last 40
      if (p.life < 40)       p.alpha = Math.min(1, p.alpha + 0.025);
      else if (p.life > p.maxLife - 40) p.alpha = Math.max(0, p.alpha - 0.025);

      // Slight sinusoidal wobble
      p.x += Math.sin(p.life * 0.04) * 0.15;

      // Draw glow dot
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${(p.alpha * 0.9).toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${(p.alpha * 0.3).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Solid core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${(p.alpha * 0.85).toFixed(3)})`;
      ctx.fill();

      return p.life < p.maxLife && p.y > -20;
    });

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (active) {
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, draw]);

  // Pause / resume on active change
  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
  }, [active, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export const Hero: React.FC<HeroProps> = ({ movies, onPlay }) => {
  const [idx, setIdx]       = useState(0);
  const [dir, setDir]       = useState(0);
  const [imgs, setImgs]     = useState<Record<string, SlideImg>>({});
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Seed image state whenever new movies arrive
  useEffect(() => {
    setImgs(prev => {
      const next = { ...prev };
      movies.forEach(m => {
        if (!next[m.id]) next[m.id] = { src: firstSrc(m), loaded: false, stage: 0 };
      });
      return next;
    });
  }, [movies]);

  // Auto-advance every 9 s (pause on hover)
  useEffect(() => {
    if (movies.length <= 1 || paused) return;
    const t = setInterval(() => advance(1), 9000);
    return () => clearInterval(t);
  }, [idx, movies.length, paused]);

  // Clamp index if movies array shrinks
  useEffect(() => {
    if (movies.length > 0 && idx >= movies.length) setIdx(0);
  }, [movies.length]);

  const advance = (d: number) => {
    setDir(d);
    setTransitioning(true);
    setIdx(prev => (prev + d + movies.length) % movies.length);
    setTimeout(() => setTransitioning(false), 600);
  };

  const goTo = (i: number) => {
    setDir(i > idx ? 1 : -1);
    setTransitioning(true);
    setIdx(i);
    setTimeout(() => setTransitioning(false), 600);
  };

  // Image fallback handlers
  const onLoad  = (id: string) =>
    setImgs(p => ({ ...p, [id]: { ...p[id], loaded: true } }));

  const onError = (id: string, m: Movie) =>
    setImgs(p => {
      const cur = p[id] || { src: '', loaded: false, stage: 0 };
      let nextSrc = '', nextStage = cur.stage + 1;
      if (nextStage === 1 && m.heroUrl   && m.heroUrl   !== cur.src) nextSrc = m.heroUrl;
      else if (nextStage <= 2 && m.posterUrl && m.posterUrl !== cur.src) { nextSrc = m.posterUrl; nextStage = 2; }
      else return { ...p, [id]: { ...cur, stage: 3, loaded: true } };
      return { ...p, [id]: { src: nextSrc, loaded: false, stage: nextStage } };
    });

  if (movies.length === 0) return null;

  const safeIdx = Math.min(idx, movies.length - 1);
  const movie   = movies[safeIdx];
  const imgSt   = imgs[movie.id];
  const accent  = movie.primaryColor || '#1d4ed8';

  const synopsis = (movie.synopsis || '').length > 165
    ? movie.synopsis.substring(0, 165) + '…'
    : (movie.synopsis || '');

  const durationLabel = movie.type === 'series'
    ? `${movie.seasons?.length ?? 1} Season${(movie.seasons?.length ?? 1) > 1 ? 's' : ''}`
    : (movie.duration || '');

  // ─── Slide transition ──────────────────────────────────────────────────────
  const slideOuter = {
    enter:  { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' as const } },
    exit:   { opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' as const } },
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#08080a] text-white select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* ── Background image layer with Ken Burns ───────────────────────────── */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={`bg-${movie.id}`}
          variants={slideOuter}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          {/* Gradient colour base — always visible while image loads */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(125deg, ${accent}55 0%, #08080a 55%)` }}
          />

          {/* Ken Burns <img> — fires onError unlike CSS background-image */}
          {imgSt && imgSt.stage < 3 && imgSt.src && (
            <img
              key={`${movie.id}-s${imgSt.stage}`}
              src={imgSt.src}
              alt=""
              aria-hidden="true"
              onLoad={() => onLoad(movie.id)}
              onError={() => onError(movie.id, movie)}
              className={`ken-burns absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${imgSt.loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Cinematic gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Colour glow radial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 55% 70% at 5% 50%, ${accent}22 0%, transparent 70%)` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Particle Dust — keyed to movie so it reskins per slide ──────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`dust-${movie.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 6 }}
        >
          <DustCanvas accent={accent} active={!transitioning} />
        </motion.div>
      </AnimatePresence>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center pl-6 sm:pl-8 md:pl-16 lg:pl-24 pr-6 pt-16 pb-24 md:pb-10">

        {/* ── Stagger group ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="flex flex-col max-w-[90%] sm:max-w-[70%] md:max-w-[55%] lg:max-w-[45%]"
          >

            {/* 1. Type badge — always gold */}
            <motion.div variants={itemVariants} className="mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full border"
                style={{ color: '#eab308', borderColor: 'rgba(234,179,8,0.45)', background: 'rgba(234,179,8,0.10)' }}
              >
                {movie.type === 'series' ? '📺 Series' : '🎬 Film'}
              </span>
            </motion.div>

            {/* 2. Title — Bebas Neue condensed cinematic font with subtle accent gradient & glow */}
            <motion.h1
              variants={itemVariants}
              className="leading-none mb-3 sm:mb-5"
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: 'clamp(3rem, 10vw, 7rem)',
                letterSpacing: '0.03em',
                lineHeight: 0.92,
                // Subtle gradient: pure white on top, accent colour gently blending in at the bottom
                background: `linear-gradient(to bottom, #ffffff 30%, ${accent} 150%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                // Heavy black shadow for readability + dynamic accent glow
                filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 40px ${accent}60)`,
              }}
            >
              {movie.title}
            </motion.h1>

            {/* 3. Metadata pills */}
            <motion.div variants={itemVariants} className="flex items-center flex-wrap gap-2 mb-4 sm:mb-5">
              <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.30)' }}>
                <Star size={11} fill="currentColor" />
                {movie.rating}
              </span>
              {durationLabel && (
                <span className="text-[11px] sm:text-xs font-medium text-zinc-300 icon-glass px-2.5 py-1 rounded-full">
                  {durationLabel}
                </span>
              )}
              <span className="text-[11px] sm:text-xs font-medium text-zinc-300 icon-glass px-2.5 py-1 rounded-full">
                {movie.year}
              </span>
              {movie.genre?.slice(0, 2).map(g => (
                <span key={g} className="text-[11px] sm:text-xs font-semibold text-white liquid-panel px-3 py-1 rounded-full shadow-lg border border-white/10 uppercase tracking-wider">
                  {g}
                </span>
              ))}
              {movie.quality === '4K' && (
                <span className="text-[10px] font-black tracking-wider text-black bg-amber-400 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                  4K
                </span>
              )}
            </motion.div>

            {/* 4. Synopsis — Cinzel italic for cinematic review-quote feel */}
            <motion.p
              variants={itemVariants}
              className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 max-w-md border-l-2 border-yellow-500/60 pl-3 sm:pl-4 italic drop-shadow-md line-clamp-3 sm:line-clamp-none"
              style={{ fontFamily: "'Cinzel', 'Georgia', serif", fontWeight: 400 }}
            >
              {synopsis}
            </motion.p>

            {/* 5. Action buttons */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              {/* Play — gold CTA */}
              <button
                onClick={() => onPlay(movie)}
                className="btn-gold group flex items-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-sm active:scale-95 transition-all"
              >
                <Play size={18} fill="currentColor" className="flex-shrink-0" />
                Play
              </button>
              {/* Details — liquid glass */}
              <button
                onClick={() => onPlay(movie)}
                className="icon-glass flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm text-white active:scale-95 transition-all"
              >
                <Info size={17} className="opacity-80 flex-shrink-0" />
                Details
              </button>
            </motion.div>

          </motion.div>
        </AnimatePresence>

        {/* ── Bottom: dots (left) + [ ‹ thumbs › ] (right) ───────────────────── */}
        {/* Adjusted bottom property to prevent overlap with the mobile fixed bottom nav */}
        <div className="absolute bottom-[88px] md:bottom-10 lg:bottom-12 left-6 sm:left-8 md:left-16 lg:left-24 right-6 sm:right-8 flex items-end sm:items-center justify-between gap-4 pointer-events-auto">

          {/* Progress dot pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0 mb-2 sm:mb-0">
            {movies.slice(0, Math.min(movies.length, 12)).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  background: i === safeIdx ? '#ffffff' : 'rgba(255,255,255,0.28)',
                  width: i === safeIdx ? 22 : 6,
                  height: 6,
                }}
              />
            ))}
          </div>

          {/* Right side: prev · thumbnails · next */}
          <div className="hidden sm:flex items-center gap-2 overflow-hidden">
            <button
              onClick={() => advance(-1)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-black/55 backdrop-blur border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 active:scale-90"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar snap-carousel">
              {movies.map((m, i) => {
                const tSrc = m.posterUrl || m.backdropUrl;
                const isActive = i === safeIdx;
                return (
                  <div
                    key={m.id}
                    onClick={() => goTo(i)}
                    className={`snap-item relative flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all duration-300 ${
                      isActive ? 'ring-2 ring-white opacity-100' : 'ring-0 opacity-38 hover:opacity-65'
                    }`}
                    style={{ width: isActive ? 54 : 46, height: 68 }}
                  >
                    <div className="absolute inset-0 bg-zinc-800" />
                    {tSrc && (
                      <img
                        src={tSrc}
                        alt={m.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => {
                          const el = e.currentTarget as HTMLImageElement;
                          if (el.src !== m.backdropUrl && m.backdropUrl) el.src = m.backdropUrl;
                          else el.style.display = 'none';
                        }}
                      />
                    )}
                    {isActive && <div className="absolute inset-0 bg-white/10" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => advance(1)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-black/55 backdrop-blur border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 active:scale-90"
            >
              <ChevronRight size={15} />
            </button>
          </div>

        </div>

      </div>


    </div>
  );
};
