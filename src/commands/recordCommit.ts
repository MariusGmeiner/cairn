import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { repoRoot, cairnPaths } from '../core/paths.js';
import { appendActivity } from '../core/activity.js';
import path from 'node:path';

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/**
 * Append one JSONL line describing HEAD to the repo's activity log.
 * Called by the post-commit hook. Designed to never throw in a way that
 * could disturb a commit — failures exit 0 silently.
 */
export function runRecordCommit(): void {
  const root = repoRoot();
  if (!root) return;
  const paths = cairnPaths(root);
  if (!fs.existsSync(paths.cairn)) return; // not a CAIRN repo → no-op

  try {
    // NUL-separated so commit messages with quotes/commas can't break parsing.
    const meta = git(['log', '-1', '--format=%H%x00%an%x00%aI%x00%s'], root);
    const [sha, author, ts, subject] = meta.split('\0');
    // Skip CAIRN's own bookkeeping commits — the log is about real work.
    if ((subject ?? '').trim().startsWith('cairn:')) return;
    const filesRaw = git(['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], root);
    const files = filesRaw.split('\n').filter(Boolean);

    appendActivity(paths.activityLog, {
      ts: ts?.trim(),
      repo: path.basename(root),
      sha: (sha ?? '').slice(0, 10),
      author: author?.trim(),
      subject: subject?.trim(),
      files: files.length,
    });
  } catch {
    // Never let hook bookkeeping interfere with the commit.
  }
}
