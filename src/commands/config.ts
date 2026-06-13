import fs from 'node:fs';
import { repoRoot, cairnPaths } from '../core/paths.js';
import {
  readConfig,
  updateConfig,
  ballotDue,
  nextVoteDate,
  toDateKey,
  daysSince,
  type CommitMode,
} from '../core/config.js';
import { c } from './style.js';

function today(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function usage(): void {
  console.log(`  ${c.heading('cairn config')}
    ${c.accent('cairn config')}                            ${c.dim('show settings + next vote')}
    ${c.accent('cairn config commit-mode')} ${c.dim('batch')}         ${c.dim('default — one cairn: commit per session at shutdown')}
    ${c.accent('cairn config commit-mode')} ${c.dim('auto')}          ${c.dim('a cairn: commit on every board action')}
    ${c.accent('cairn config commit-mode')} ${c.dim('ride-along')}    ${c.dim('write only; rides with your next commit')}
    ${c.accent('cairn config ballot-done')} ${c.dim('[winner-id]')}   ${c.dim('record a vote held today + its winner')}`);
}

export function runConfig(args: string[]): void {
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

  const sub = args[0];

  if (!sub) {
    const cfg = readConfig(paths);
    const due = ballotDue(cfg);
    const nd = nextVoteDate(cfg);
    const ndKey = nd ? toDateKey(nd) : null;
    const sinceNext = ndKey ? daysSince(ndKey) : null; // negative when in the future
    console.log('');
    console.log(`  ${c.dim('commit mode')}     ${c.accent(cfg.commitMode)}`);
    console.log(`  ${c.dim('last vote')}       ${cfg.lastBallot ?? c.dim('never')}`);
    if (cfg.votedFeature) {
      const state = cfg.votedFeatureShipped
        ? c.good(`shipped ${cfg.votedFeatureShipped}`)
        : c.dim('in flight');
      console.log(`  ${c.dim('voted feature')}   ${c.accent(cfg.votedFeature)}  ${state}`);
    } else {
      console.log(`  ${c.dim('voted feature')}   ${c.dim('none')}`);
    }
    const nextStr = due
      ? c.warn('due now — run /cairn-ballot')
      : ndKey
        ? `${ndKey} (Mon)` + (sinceNext != null ? c.dim(`  · in ${-sinceNext}d`) : '')
        : c.dim('—');
    console.log(`  ${c.dim('next vote')}       ${nextStr}`);
    console.log('');
    return;
  }

  if (sub === 'commit-mode') {
    const mode = args[1] as CommitMode | undefined;
    if (mode !== 'auto' && mode !== 'ride-along' && mode !== 'batch') {
      console.error(c.bad('Usage: cairn config commit-mode <batch|auto|ride-along>'));
      process.exitCode = 1;
      return;
    }
    updateConfig(paths, { commitMode: mode });
    console.log(`  ${c.good('✓')} commit mode → ${c.accent(mode)}`);
    return;
  }

  if (sub === 'ballot-done') {
    const date = today();
    const winner = args[1];
    updateConfig(paths, {
      lastBallot: date,
      votedFeature: winner || undefined,
      votedFeatureShipped: undefined,
    });
    const nd = nextVoteDate(readConfig(paths));
    console.log(
      `  ${c.good('✓')} vote recorded ${c.dim(date)}` +
        (winner ? ` · winner ${c.accent(winner)}` : '') +
        (nd ? c.dim(` · next vote ${toDateKey(nd)} (Mon)`) : ''),
    );
    return;
  }

  console.error(c.bad(`Unknown config command: ${sub}`));
  usage();
  process.exitCode = 1;
}
