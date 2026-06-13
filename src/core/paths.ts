import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

/** Resolve the git repo root for a directory, or null if not in a repo. */
export function repoRoot(cwd: string = process.cwd()): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const trimmed = out.trim();
    return trimmed ? path.normalize(trimmed) : null;
  } catch {
    return null;
  }
}

/** Resolve the git dir (handles worktrees), or null. */
export function gitDir(cwd: string = process.cwd()): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const trimmed = out.trim();
    return trimmed ? path.normalize(trimmed) : null;
  } catch {
    return null;
  }
}

export interface CairnPaths {
  root: string;
  cairn: string;
  backlog: string;
  board: string;
  current: string;
  queue: string;
  daily: string;
  activity: string;
  activityLog: string;
  rootGitignore: string;
}

/** All the well-known paths inside a repo's .cairn/ folder. */
export function cairnPaths(root: string): CairnPaths {
  const cairn = path.join(root, '.cairn');
  const board = path.join(cairn, 'board');
  const activity = path.join(cairn, 'activity');
  return {
    root,
    cairn,
    backlog: path.join(cairn, 'backlog'),
    board,
    current: path.join(board, 'current.md'),
    queue: path.join(board, 'queue.md'),
    daily: path.join(cairn, 'daily'),
    activity,
    activityLog: path.join(activity, 'log.jsonl'),
    rootGitignore: path.join(root, '.gitignore'),
  };
}

/** Root of the installed cairn package (one level up from dist/). */
export function packageRoot(): string {
  // This file compiles to dist/core/paths.js → package root is two levels up.
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

/** Bundled skills shipped inside the package. */
export function bundledSkillsDir(): string {
  return path.join(packageRoot(), 'skills');
}

/** The user-global Claude skills directory. */
export function userSkillsDir(): string {
  return path.join(os.homedir(), '.claude', 'skills');
}
