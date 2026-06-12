import fs from 'node:fs';
import path from 'node:path';

export interface ActivityLine {
  ts?: string;
  event?: string;
  id?: string;
  title?: string;
  target?: string;
  repo?: string;
  sha?: string;
  author?: string;
  subject?: string;
  files?: number;
  [k: string]: unknown;
}

/** Append a single JSONL line to the activity log, creating the dir if needed. */
export function appendActivity(activityLogPath: string, obj: ActivityLine): void {
  fs.mkdirSync(path.dirname(activityLogPath), { recursive: true });
  fs.appendFileSync(activityLogPath, JSON.stringify(obj) + '\n');
}

/** Read and parse the activity log, skipping corrupt lines. */
export function readActivity(activityLogPath: string): ActivityLine[] {
  if (!fs.existsSync(activityLogPath)) return [];
  let raw: string;
  try {
    raw = fs.readFileSync(activityLogPath, 'utf8');
  } catch {
    return [];
  }
  const out: ActivityLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as ActivityLine);
    } catch {
      /* skip corrupt line */
    }
  }
  return out;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** How many items were shipped today (local time), for the streak counter. */
export function shippedToday(lines: ActivityLine[], now: Date = new Date()): number {
  const key = localDateKey(now);
  let n = 0;
  for (const l of lines) {
    if (l.event !== 'ship' || !l.ts) continue;
    const t = new Date(l.ts);
    if (!Number.isNaN(t.getTime()) && localDateKey(t) === key) n++;
  }
  return n;
}

/** The most recent commit lines (newest last), for sync/context. */
export function recentCommits(lines: ActivityLine[], limit = 10): ActivityLine[] {
  return lines.filter((l) => l.sha).slice(-limit);
}
