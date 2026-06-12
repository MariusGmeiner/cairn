import type { ItemType } from '../core/backlog.js';

/**
 * A small, ANSI-safe palette. Color carries meaning only (item type, progress,
 * liveness) — no gradients or decoration. Names map to Ink/chalk color strings.
 */
export const palette = {
  accent: 'cyanBright',
  accentDim: 'cyan',
  rule: 'gray',
  dim: 'gray',
  text: 'white',
  heading: 'whiteBright',
  good: 'greenBright',
  warn: 'yellow',
  bad: 'redBright',
  empty: 'gray',
  live: 'greenBright',
} as const;

/** Each backlog type gets one stable color + a short uppercase badge. */
export const typeStyle: Record<ItemType, { color: string; badge: string }> = {
  core: { color: 'cyanBright', badge: 'CORE' },
  feature: { color: 'greenBright', badge: 'FEAT' },
  qol: { color: 'magenta', badge: 'QOL' },
  bug: { color: 'redBright', badge: 'BUG' },
};

export const statusColor: Record<string, string> = {
  now: 'cyanBright',
  next: 'white',
  later: 'gray',
  inbox: 'yellow',
  shipped: 'greenBright',
  wontdo: 'gray',
};

const FILLED = '█';
const HALF = '▓';
const EMPTY = '░';

/** Render a fixed-width progress bar string (no color — caller colors it). */
export function progressBar(progress: number, width = 10): string {
  const pct = Math.max(0, Math.min(100, progress));
  const exact = (pct / 100) * width;
  const full = Math.floor(exact);
  const remainder = exact - full;
  let bar = FILLED.repeat(full);
  if (full < width && remainder >= 0.5) bar += HALF;
  bar = bar.padEnd(width, EMPTY);
  return bar;
}

/** Color for a progress value: ramps grey → yellow → green as it fills. */
export function progressColor(progress: number): string {
  if (progress >= 60) return palette.good;
  if (progress >= 25) return palette.warn;
  return palette.accentDim;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Truncate with an ellipsis so long titles never break the layout. */
export function truncate(s: string, max: number): string {
  if (max <= 1) return s.slice(0, Math.max(0, max));
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
