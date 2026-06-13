import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import type { CairnPaths } from './paths.js';

/** Statuses that are terminal — the item is done and no longer part of active planning. */
const TERMINAL = new Set(['shipped', 'wontdo']);

/**
 * Move a backlog item file out of the active backlog into `.cairn/archive/`. Keeps the
 * model's planning scan small (only live work stays in backlog/), while git preserves the
 * full history via the rename. Idempotent: a file already under archive/ is left in place.
 * Returns the file's resting path.
 */
export function archiveItemFile(paths: CairnPaths, file: string): string {
  const dest = path.join(paths.archive, path.basename(file));
  if (path.resolve(file) === path.resolve(dest)) return dest;
  fs.mkdirSync(paths.archive, { recursive: true });
  if (fs.existsSync(dest)) fs.rmSync(dest); // renameSync won't overwrite on Windows
  fs.renameSync(file, dest);
  return dest;
}

/**
 * Sweep any terminal (shipped/wontdo) items still sitting in the active backlog into the
 * archive. Used to migrate existing repos; advance() archives the just-shipped item directly.
 * Returns the number of files moved.
 */
export function sweepTerminalItems(paths: CairnPaths): number {
  if (!fs.existsSync(paths.backlog)) return 0;
  let moved = 0;
  for (const f of fs.readdirSync(paths.backlog)) {
    if (!f.endsWith('.md')) continue;
    const file = path.join(paths.backlog, f);
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const { data } = parseFrontmatter(raw);
    const status = String(data.status ?? '').toLowerCase();
    if (TERMINAL.has(status)) {
      archiveItemFile(paths, file);
      moved++;
    }
  }
  return moved;
}
