import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { CairnPaths } from './paths.js';
import { readConfig } from './config.js';

/** Only CAIRN's own versioned files — never the gitignored activity log, never code. */
const COMMIT_PATHS = ['.cairn/backlog', '.cairn/board', '.cairn/daily', '.cairn/config.json'];

export interface CommitResult {
  committed: boolean;
  reason?: 'ride-along' | 'nothing' | 'error';
  sha?: string;
  message?: string;
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function existingPaths(root: string): string[] {
  return COMMIT_PATHS.filter((p) => fs.existsSync(path.join(root, p)));
}

/** The actual changed/untracked files under the target prefixes (handles renames). */
function changedFiles(root: string, prefixes: string[]): string[] {
  if (prefixes.length === 0) return [];
  let out: string;
  try {
    out = git(['status', '--porcelain', '--', ...prefixes], root);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const line of out.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let p = line.slice(3).trim();
    const arrow = p.indexOf(' -> ');
    if (arrow !== -1) p = p.slice(arrow + 4); // rename: take the destination
    p = p.replace(/^"(.*)"$/, '$1'); // unquote paths with special chars
    if (p) files.push(p);
  }
  return files;
}

/**
 * Commit CAIRN's own .cairn/ changes under a `cairn:` prefix, scoped to the exact
 * changed files so the user's unrelated staged work is never swept in. Filter these
 * out of code history with: git log --invert-grep --grep='^cairn:'
 */
export function commitCairn(paths: CairnPaths, subject: string): CommitResult {
  const root = paths.root;
  const files = changedFiles(root, existingPaths(root));
  if (files.length === 0) return { committed: false, reason: 'nothing' };
  const message = `cairn: ${subject}`;
  try {
    git(['add', '--', ...files], root);
    git(['commit', '-m', message, '--', ...files], root);
    let sha = '';
    try {
      sha = git(['rev-parse', '--short', 'HEAD'], root).trim();
    } catch {
      /* sha is best-effort */
    }
    return { committed: true, sha, message };
  } catch {
    return { committed: false, reason: 'error' };
  }
}

/** Honor the repo's commit mode: commit in auto, no-op in ride-along. */
export function maybeCommit(paths: CairnPaths, subject: string): CommitResult {
  if (readConfig(paths).commitMode === 'ride-along') {
    return { committed: false, reason: 'ride-along' };
  }
  return commitCairn(paths, subject);
}
