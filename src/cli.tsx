#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { render } from 'ink';
import { repoRoot, cairnPaths, packageRoot } from './core/paths.js';
import { advance } from './core/advance.js';
import { maybeCommit } from './core/gitCommit.js';
import { runInit } from './commands/init.js';
import { runInstallSkills } from './commands/installSkills.js';
import { runRecordCommit } from './commands/recordCommit.js';
import { runConfig } from './commands/config.js';
import { runCommit } from './commands/commit.js';
import { c } from './commands/style.js';
import { App } from './tui/App.js';

function version(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot(), 'package.json'), 'utf8'));
    return String(pkg.version ?? '0.0.0');
  } catch {
    return '0.0.0';
  }
}

function help(): void {
  const A = c.accent;
  const D = c.dim;
  console.log(`
  ${c.heading('⣠⣾⣷⣄ CAIRN')} ${D('· Command-line Assistant Interface for Roadmaps and Next actions')}

  ${c.heading('Usage')}
    ${A('cairn')}                  ${D('open the board (TUI) for the current repo')}
    ${A('cairn init')}             ${D('scaffold .cairn/ and install the post-commit hook')}
    ${A('cairn install-skills')}   ${D('install /cairn-capture /cairn-intake /cairn-plan /cairn-sync /cairn-shutdown /cairn-ballot /cairn-loop into ~/.claude/skills')}
    ${A('cairn advance')}          ${D('mark the current action done + advance (same as [a] in the TUI)')}
    ${A('cairn commit [msg]')}     ${D('commit .cairn changes per commit mode (--flush forces one now)')}
    ${A('cairn config')}           ${D('show/set commit mode (batch default) + ballot cadence')}
    ${A('cairn record-commit')}    ${D('internal — called by the git post-commit hook')}

  ${c.heading('Options')}
    ${A('--bare')}                 ${D('with init: do not seed starter items')}
    ${A('--force')}                ${D('with install-skills: overwrite existing skills')}
    ${A('-v, --version')}          ${D('print version')}
    ${A('-h, --help')}             ${D('print this help')}

  ${D('Inside the TUI:')}  ${A('←/→')} ${D('tabs')}   ${A('a')} ${D('ship')}   ${A('v')} ${D('read')}   ${A('1–5')} ${D('filter')}   ${A('q')} ${D('quit')}
`);
}

function runAdvanceCli(): void {
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
  const result = advance(paths);
  if (!result.changed) {
    console.log(c.dim('Nothing to advance — the queue is empty. Run /cairn-plan.'));
    return;
  }
  if (result.shipped)
    console.log(`${c.good('✓ shipped')}  ${result.shipped.id}  ${c.dim(result.shipped.title)}`);
  if (result.queueEmpty) console.log(c.warn('  queue now empty — run /cairn-plan to refill'));
  else if (result.next)
    console.log(`${c.accent('▸ now')}      ${result.next.id}  ${c.dim(result.next.title)}`);

  // Persist per the repo's commit mode (cairn: prefix, or ride-along no-op).
  const subject = result.queueEmpty
    ? `ship ${result.shipped?.id ?? ''} · queue empty`.trim()
    : `ship ${result.shipped?.id ?? ''} · now ${result.next?.id ?? ''}`.trim();
  const commit = maybeCommit(paths, subject);
  if (commit.committed) console.log(c.dim(`  committed ${commit.sha ?? ''} ${commit.message}`));
}

function launchTui(): void {
  const root = repoRoot();
  if (!root) {
    console.error(
      c.bad('Not inside a git repository. `cd` into a repo (or `git init`), then run cairn.'),
    );
    process.exitCode = 1;
    return;
  }
  const paths = cairnPaths(root);
  if (!fs.existsSync(paths.cairn)) {
    console.error(
      c.warn('No .cairn/ in this repo yet.') +
        c.dim('  Run ') +
        c.accent('cairn init') +
        c.dim(' to get started.'),
    );
    process.exitCode = 1;
    return;
  }
  // Run as a fullscreen app on the alternate screen buffer so the board owns the
  // viewport and the shell scrollback is left untouched on quit.
  const ALT_ENTER = '[?1049h';
  const ALT_LEAVE = '[?1049l';
  const fullscreen = Boolean(process.stdout.isTTY);
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    if (fullscreen) process.stdout.write(ALT_LEAVE);
  };
  if (fullscreen) process.stdout.write(ALT_ENTER);
  process.on('exit', restore);

  const app = render(<App paths={paths} />);
  app.waitUntilExit().then(restore, restore);
}

function main(): void {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flags = new Set(argv.slice(1));

  if (cmd === '-v' || cmd === '--version') {
    console.log(version());
    return;
  }
  if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
    help();
    return;
  }

  switch (cmd) {
    case undefined:
      launchTui();
      return;
    case 'init':
      runInit({ bare: flags.has('--bare') });
      return;
    case 'install-skills':
      runInstallSkills({ force: flags.has('--force') });
      return;
    case 'record-commit':
      runRecordCommit();
      return;
    case 'advance':
      runAdvanceCli();
      return;
    case 'commit':
      runCommit(argv.slice(1));
      return;
    case 'config':
      runConfig(argv.slice(1));
      return;
    default:
      console.error(c.bad(`Unknown command: ${cmd}`));
      console.error(c.dim('Run `cairn --help` for usage.'));
      process.exitCode = 1;
  }
}

main();
