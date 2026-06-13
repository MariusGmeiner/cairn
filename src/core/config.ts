import fs from 'node:fs';
import path from 'node:path';
import type { CairnPaths } from './paths.js';

export type CommitMode = 'auto' | 'ride-along' | 'batch';

export interface CairnConfig {
  /** auto = CAIRN commits its own .cairn changes on every action with a `cairn:` prefix.
   *  batch = CAIRN defers; the whole session's .cairn changes land as one `cairn:` commit
   *          at /cairn-shutdown (or `cairn commit --flush`). The default — keeps history readable.
   *  ride-along = CAIRN only writes files; they go in with your next code commit. */
  commitMode: CommitMode;
  /** date the last vote was held (YYYY-MM-DD) — anchors the fortnightly Monday cadence. */
  lastBallot?: string;
  /** the winning item id from the last vote. */
  votedFeature?: string;
  /** date the voted feature shipped (YYYY-MM-DD) — brings the next vote forward. */
  votedFeatureShipped?: string;
}

const DEFAULTS: CairnConfig = { commitMode: 'batch' };

/** Votes recur every second Monday. */
export const BALLOT_WEEKS = 2;

export function configPath(paths: CairnPaths): string {
  return path.join(paths.cairn, 'config.json');
}

export function readConfig(paths: CairnPaths): CairnConfig {
  const file = configPath(paths);
  if (!fs.existsSync(file)) return { ...DEFAULTS };
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<CairnConfig>;
    const cm = raw.commitMode;
    return {
      commitMode: cm === 'ride-along' || cm === 'batch' || cm === 'auto' ? cm : 'batch',
      lastBallot: typeof raw.lastBallot === 'string' ? raw.lastBallot : undefined,
      votedFeature: typeof raw.votedFeature === 'string' ? raw.votedFeature : undefined,
      votedFeatureShipped:
        typeof raw.votedFeatureShipped === 'string' ? raw.votedFeatureShipped : undefined,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeConfig(paths: CairnPaths, cfg: CairnConfig): void {
  fs.mkdirSync(paths.cairn, { recursive: true });
  const out: CairnConfig = { commitMode: cfg.commitMode };
  if (cfg.lastBallot) out.lastBallot = cfg.lastBallot;
  if (cfg.votedFeature) out.votedFeature = cfg.votedFeature;
  if (cfg.votedFeatureShipped) out.votedFeatureShipped = cfg.votedFeatureShipped;
  fs.writeFileSync(configPath(paths), JSON.stringify(out, null, 2) + '\n');
}

export function updateConfig(paths: CairnPaths, patch: Partial<CairnConfig>): CairnConfig {
  const next = { ...readConfig(paths), ...patch };
  writeConfig(paths, next);
  return next;
}

// ── date helpers ──────────────────────────────────────────────────────────────

function parseISO(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** The Monday on or after a date (returns the same day if it is a Monday). */
function mondayOnOrAfter(d: Date): Date {
  const delta = (8 - d.getDay()) % 7; // getDay: 0=Sun..6=Sat; 0 when already Monday
  return addDays(d, delta);
}

/** Whole days elapsed since an ISO date, or null if unset/unparseable. */
export function daysSince(dateStr: string | undefined, now: Date = new Date()): number | null {
  const d = parseISO(dateStr);
  if (!d) return null;
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

/**
 * When the next vote is due: the second Monday after the last vote, brought forward to
 * the Monday after the voted feature shipped (if that happens sooner). Null = due now
 * (no vote has ever run).
 */
export function nextVoteDate(cfg: CairnConfig): Date | null {
  const lb = parseISO(cfg.lastBallot);
  if (!lb) return null;
  let next = mondayOnOrAfter(addDays(lb, BALLOT_WEEKS * 7));
  // votedFeatureShipped is cleared on each new vote, so any value here belongs to the
  // current cycle (>= lastBallot, including a same-day ship).
  const shipped = parseISO(cfg.votedFeatureShipped);
  if (shipped && shipped.getTime() >= lb.getTime()) {
    const earlier = mondayOnOrAfter(addDays(shipped, 1)); // the Monday after shipping
    if (earlier.getTime() < next.getTime()) next = earlier;
  }
  return next;
}

/** True once today is on/after the next vote date (or no vote has ever run). */
export function ballotDue(cfg: CairnConfig, now: Date = new Date()): boolean {
  const nd = nextVoteDate(cfg);
  if (!nd) return true;
  return toDateKey(now) >= toDateKey(nd);
}
