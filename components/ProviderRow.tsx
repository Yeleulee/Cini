import React from 'react';
import { SectionHeader, ScrollRow } from './MediaRow';

export interface Provider {
  id: string;
  name: string;
  short: string;
  bg: string;
  fg?: string;
}

// Brand-coloured wordmarks stand in for TMDB provider logos (no logo assets in this project).
export const PROVIDERS: Provider[] = [
  { id: 'netflix',    name: 'Netflix',            short: 'N',         bg: 'linear-gradient(160deg,#1a0000 0%,#000 100%)', fg: '#E50914' },
  { id: 'prime',      name: 'Amazon Prime Video', short: 'prime',     bg: 'linear-gradient(160deg,#00A8E1 0%,#0f79af 100%)' },
  { id: 'disney',     name: 'Disney Plus',        short: 'Disney+',   bg: 'linear-gradient(160deg,#0b1b6b 0%,#113CCF 100%)' },
  { id: 'appletv',    name: 'Apple TV+',          short: 'tv+',      bg: 'linear-gradient(160deg,#2a2a2e 0%,#000 100%)' },
  { id: 'hulu',       name: 'Hulu',               short: 'hulu',      bg: 'linear-gradient(160deg,#1CE783 0%,#13b865 100%)', fg: '#040405' },
  { id: 'hbo',        name: 'HBO Max',            short: 'max',       bg: 'linear-gradient(160deg,#002be7 0%,#5822B4 100%)' },
  { id: 'paramount',  name: 'Paramount Plus',     short: 'P+',        bg: 'linear-gradient(160deg,#0064FF 0%,#0038a8 100%)' },
  { id: 'peacock',    name: 'Peacock Premium',    short: 'peacock',   bg: 'linear-gradient(160deg,#000 0%,#1c1c1f 100%)' },
  { id: 'crunchy',    name: 'Crunchyroll',        short: 'CR',        bg: 'linear-gradient(160deg,#F47521 0%,#d85e0f 100%)' },
  { id: 'starz',      name: 'Starz',              short: 'STARZ',     bg: 'linear-gradient(160deg,#111 0%,#000 100%)' },
  { id: 'amc',        name: 'AMC+',               short: 'AMC+',      bg: 'linear-gradient(160deg,#1b1b1b 0%,#000 100%)', fg: '#f6c90e' },
  { id: 'mgm',        name: 'MGM Plus',           short: 'MGM+',      bg: 'linear-gradient(160deg,#2b2b2b 0%,#000 100%)', fg: '#e5b84d' },
  { id: 'ytp',        name: 'YouTube Premium',    short: '▶',         bg: 'linear-gradient(160deg,#1f1f1f 0%,#000 100%)', fg: '#FF0000' },
  { id: 'tubi',       name: 'Tubi TV',            short: 'tubi',      bg: 'linear-gradient(160deg,#fa382f 0%,#c41f17 100%)' },
  { id: 'pluto',      name: 'Pluto TV',           short: 'pluto',     bg: 'linear-gradient(160deg,#111 0%,#000 100%)', fg: '#f2f216' },
];

interface ProviderRowProps {
  onSelect?: (provider: Provider) => void;
}

export const ProviderRow: React.FC<ProviderRowProps> = ({ onSelect }) => (
  <section>
    <SectionHeader title="Browse by Provider" />
    <ScrollRow className="pb-6">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect?.(p)}
          aria-label={p.name}
          className="group/tile flex w-[76px] flex-none flex-col items-center gap-2 lg:w-[92px]"
        >
          <span
            className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white/5 text-sm font-extrabold tracking-tight ring-1 ring-white/10 shadow-lg shadow-black/40 transition-all duration-300 group-hover/tile:scale-105 group-hover/tile:ring-white/30"
            style={{ background: p.bg, color: p.fg ?? '#fff' }}
          >
            {p.short}
          </span>
          <span className="w-full text-center text-xs text-white/70 line-clamp-1 transition-colors group-hover/tile:text-white">
            {p.name}
          </span>
        </button>
      ))}
    </ScrollRow>
  </section>
);
