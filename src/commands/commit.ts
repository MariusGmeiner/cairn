import fs from 'node:fs';
import { repoRoot, cairnPaths } from '../core/paths.js';
import { maybeCommit, commitCairn } from '../core/gitCommit.js';
import { c } from './style.js';

/**
 * `cairn commit [message] [--flush]` — commit .cairn changes per the repo's commit mode.
 * `--flush` (alias `--now`) forces the commit even in batch/ride-along mode; /cairn-shutdown
 * uses it to write the whole session's deferred changes as one `cairn:` commit.
 */
export function runCommit(args: string[]): void {
  const root = repoRoot();
  if (!root) {
    console.error(c.bad('Not inside a git repository.'));
    process.exitCode = 1;
    return;
  }
  const paths = cairnPaths(root);
  if (!fs.existsSync(paths.cairn)) {
    console.error(c.bad('No .cairn/ here — run `cairn init` first.'));
    process.exitCode = 1;
    return;
  }

  const flush = args.includes('--flush') || args.includes('--now');
  const subject = args.filter((a) => !a.startsWith('--')).join(' ').trim() || 'update board';
  const res = flush ? commitCairn(paths, subject) : maybeCommit(paths, subject);

  if (res.reason === 'ride-along') {
    console.log(c.dim('ride-along — .cairn changes left for your next code commit'));
    return;
  }
  if (res.reason === 'deferred') {
    console.log(
      c.dim('batch — .cairn changes deferred; they commit at /cairn-shutdown ') +
        c.dim('(or now with ') +
        c.accent('cairn commit --flush') +
        c.dim(')'),
    );
    return;
  }
  if (res.committed) {
    console.log(`${c.good('✓ committed')} ${c.dim(res.sha ?? '')}  ${res.message}`);
    return;
  }
  if (res.reason === 'nothing') {
    console.log(c.dim('nothing to commit in .cairn/'));
    return;
  }
  console.log(c.warn('could not commit .cairn/ (is your git identity configured?)'));
  process.exitCode = 1;
}
