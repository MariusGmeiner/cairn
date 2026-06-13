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
  // Two-tone "lit from the right": a bright edge catching the light + a shadow body.
  // The contrast is by HUE (cyan vs blue), not just brightness — so it stays visibly
  // two-tone even on terminals that render the bright variant the same as the base.
  // Reused across the logo, lettering, rules, and markers for one consistent light source.
  lit: 'cyanBright',
  shadow: 'blue',
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

/**
 * OSC-8 hyperlink: renders as `label`, clickable (Ctrl/⌘+Click) in terminals that
 * support it, and harmless plain text elsewhere. Width measurement strips the escape,
 * so layout is unaffected.
 */
export function link(label: string, url: string): string {
  const OSC = ']8;;';
  const BEL = '';
  return `${OSC}${url}${BEL}${label}${OSC}${BEL}`;
}

/**
 * Word-wrap a single logical line into display rows no wider than `width`, breaking
 * over-long tokens hard. Used to page long content one terminal row at a time.
 */
export function wrapText(line: string, width: number): string[] {
  if (width <= 0 || line.length <= width) return [line];
  const out: string[] = [];
  let cur = '';
  for (const word of line.split(/(\s+)/)) {
    if (cur.length > 0 && (cur + word).length > width) {
      out.push(cur.replace(/\s+$/, ''));
      cur = word.replace(/^\s+/, '');
    } else {
      cur += word;
    }
    while (cur.length > width) {
      out.push(cur.slice(0, width));
      cur = cur.slice(width);
    }
  }
  if (cur.length > 0) out.push(cur);
  return out.length > 0 ? out : [''];
}
