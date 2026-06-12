import fs from 'node:fs';
import { repoRoot, cairnPaths } from '../core/paths.js';
import { maybeCommit } from '../core/gitCommit.js';
import { c } from './style.js';

/** `cairn commit [message]` — commit .cairn changes per the repo's commit mode. */
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

  const subject = args.join(' ').trim() || 'update board';
  const res = maybeCommit(paths, subject);

  if (res.reason === 'ride-along') {
    console.log(c.dim('ride-along — .cairn changes left for your next code commit'));
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
