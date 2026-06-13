import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { repoRoot, gitDir, cairnPaths, CairnPaths } from '../core/paths.js';
import { writeCurrent, writeQueue } from '../core/board.js';
import { readBacklog } from '../core/backlog.js';
import { readConfig, writeConfig, configPath } from '../core/config.js';
import { c } from './style.js';

export interface InitOptions {
  bare?: boolean; // skip seeding starter items
}

function today(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function writeIfAbsent(file: string, content: string): boolean {
  if (fs.existsSync(file)) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

const IGNORE_COMMENT = '# CAIRN local, derived — keep out of git';
const ACTIVITY_IGNORE = '.cairn/activity/';

/**
 * Ensure the repo's root .gitignore ignores the derived activity log. Idempotent:
 * re-running is a no-op once the entry is present (with or without a trailing slash).
 */
function ensureActivityIgnored(rootGitignore: string): 'created' | 'appended' | 'already' {
  if (!fs.existsSync(rootGitignore)) {
    fs.writeFileSync(rootGitignore, `${IGNORE_COMMENT}\n${ACTIVITY_IGNORE}\n`);
    return 'created';
  }
  const existing = fs.readFileSync(rootGitignore, 'utf8');
  const present = existing
    .split(/\r?\n/)
    .map((l) => l.trim())
    .some((l) => l === ACTIVITY_IGNORE || l === '.cairn/activity');
  if (present) return 'already';
  const lead = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(rootGitignore, `${lead}\n${IGNORE_COMMENT}\n${ACTIVITY_IGNORE}\n`);
  return 'appended';
}

/**
 * Earlier inits wrote a nested .cairn/.gitignore (ignoring `activity/`). The root
 * .gitignore now owns that rule, so drop the nested file — but only if it still holds
 * exactly what we generated, never a file the user has since customized.
 */
function dropLegacyNestedIgnore(cairnDir: string): boolean {
  const nested = path.join(cairnDir, '.gitignore');
  const LEGACY = `${IGNORE_COMMENT}\nactivity/\n`;
  if (fs.existsSync(nested) && fs.readFileSync(nested, 'utf8') === LEGACY) {
    fs.rmSync(nested);
    return true;
  }
  return false;
}

interface SeedItem {
  id: string;
  title: string;
  summary: string;
  type: string;
  area: string;
  size: string;
  status: string;
  target?: string;
  notes?: string;
}

function itemMarkdown(it: SeedItem, date: string): string {
  const lines = [
    '---',
    `id: ${it.id}`,
    `title: ${it.title}`,
    `summary: ${it.summary}`,
    `requested_by: you`,
    `date: ${date}`,
    `type: ${it.type}`,
    `area: ${it.area}`,
    `benefits: you`,
    `size: ${it.size}`,
    `status: ${it.status}`,
    `target: ${it.target ?? ''}`,
    `notes: ${it.notes ?? ''}`,
    '---',
    '',
    it.summary,
    '',
  ];
  return lines.join('\n');
}

const STARTERS: SeedItem[] = [
  {
    id: 'CAIRN-001',
    title: 'Mark your first action done',
    summary: 'Press [a] (or click Done) to ship this and watch CAIRN advance.',
    type: 'core',
    area: 'onboarding',
    size: 'S',
    status: 'now',
    target: 'you pressed [a] and CAIRN advanced to the next action',
  },
  {
    id: 'CAIRN-002',
    title: 'Capture a real idea with /cairn-capture',
    summary: 'Run /cairn-capture in the Claude Code pane and answer a couple of questions.',
    type: 'feature',
    area: 'onboarding',
    size: 'S',
    status: 'next',
    target: 'a new item file exists in .cairn/backlog/',
  },
  {
    id: 'CAIRN-003',
    title: 'Shape the roadmap with /cairn-plan',
    summary: 'Run /cairn-plan to refresh Now / Next / Later and pre-compute the queue.',
    type: 'core',
    area: 'onboarding',
    size: 'S',
    status: 'next',
    target: 'queue.md lists your real next steps',
  },
  {
    id: 'CAIRN-004',
    title: 'Retire these starters as wontdo',
    summary: 'Once you have the hang of it, set the CAIRN-00x onboarding items to status: wontdo (not delete) — CAIRN keeps the record.',
    type: 'qol',
    area: 'onboarding',
    size: 'S',
    status: 'later',
    notes: 'they live in .cairn/backlog/ — change each status: to wontdo',
  },
  {
    id: 'CAIRN-005',
    title: 'An idea you jotted but have not triaged',
    summary: 'export the report to xlsx?',
    type: 'feature',
    area: 'inbox',
    size: 'S',
    status: 'inbox',
  },
];

function seedStarters(paths: CairnPaths, date: string): number {
  let n = 0;
  for (const it of STARTERS) {
    const file = path.join(paths.backlog, `${it.id}.md`);
    if (writeIfAbsent(file, itemMarkdown(it, date))) n++;
  }
  if (!fs.existsSync(paths.current)) {
    writeCurrent(paths.current, {
      id: 'CAIRN-001',
      target: STARTERS[0].target,
      progress: 0,
      started: date,
      body: '',
    });
  }
  if (!fs.existsSync(paths.queue)) {
    const titleOf = (id: string) => STARTERS.find((s) => s.id === id)?.title;
    writeQueue(paths.queue, ['CAIRN-002', 'CAIRN-003'], titleOf);
  }
  return n;
}

const HOOK_LINE = 'command -v cairn >/dev/null 2>&1 && cairn record-commit >/dev/null 2>&1 || true';
const HOOK_SCRIPT = [
  '#!/bin/sh',
  '# CAIRN post-commit hook — logs each commit to .cairn/activity/log.jsonl',
  HOOK_LINE,
  '',
].join('\n');

function installHook(root: string): 'created' | 'appended' | 'already' | 'skipped' {
  const gd = gitDir(root);
  if (!gd) return 'skipped';
  const hooksDir = path.join(gd, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const hookPath = path.join(hooksDir, 'post-commit');

  if (!fs.existsSync(hookPath)) {
    fs.writeFileSync(hookPath, HOOK_SCRIPT);
    try {
      fs.chmodSync(hookPath, 0o755);
    } catch {
      /* chmod is a no-op / unsupported on some Windows setups */
    }
    return 'created';
  }

  const existing = fs.readFileSync(hookPath, 'utf8');
  if (existing.includes('cairn record-commit')) return 'already';
  const appended = existing.replace(/\s*$/, '\n') + '\n# CAIRN\n' + HOOK_LINE + '\n';
  fs.writeFileSync(hookPath, appended);
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    /* ignore */
  }
  return 'appended';
}

function globalHooksPathWarning(root: string): string | null {
  try {
    const out = execFileSync('git', ['config', '--get', 'core.hooksPath'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? out : null;
  } catch {
    return null;
  }
}

export function runInit(opts: InitOptions = {}): void {
  const root = repoRoot();
  if (!root) {
    console.error(c.bad('Not inside a git repository. Run `git init` first, then `cairn init`.'));
    process.exitCode = 1;
    return;
  }
  const paths = cairnPaths(root);
  const date = today();
  const fresh = !fs.existsSync(paths.cairn);

  for (const dir of [paths.backlog, paths.archive, paths.board, paths.daily, paths.activity]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const ignore = ensureActivityIgnored(paths.rootGitignore);
  const droppedNested = dropLegacyNestedIgnore(paths.cairn);
  const wroteConfig = !fs.existsSync(configPath(paths));
  if (wroteConfig) writeConfig(paths, { commitMode: 'batch' });
  const cfg = readConfig(paths);

  let seeded = 0;
  const existingItems = readBacklog(paths.backlog).length;
  if (!opts.bare && existingItems === 0) {
    seeded = seedStarters(paths, date);
  } else {
    if (!fs.existsSync(paths.current)) writeCurrent(paths.current, {});
    if (!fs.existsSync(paths.queue)) writeQueue(paths.queue, []);
  }

  const hook = installHook(root);
  const hooksWarn = globalHooksPathWarning(root);

  // Report.
  console.log(c.heading('\n  ⣠⣾⣷⣄ CAIRN initialized') + c.dim(`  ·  ${path.basename(root)}`) + '\n');
  console.log(
    `  ${fresh ? c.good('✓ created') : c.dim('• present')}  ${c.dim('.cairn/')} ${c.dim('(backlog · board · daily · activity)')}`,
  );
  const ignoreMsg = {
    created: `${c.good('✓ wrote')}    ${c.dim('.gitignore')} ${c.dim('(ignores .cairn/activity/)')}`,
    appended: `${c.good('✓ updated')}  ${c.dim('.gitignore')} ${c.dim('(ignores .cairn/activity/)')}`,
    already: `${c.dim('• present')}   ${c.dim('.gitignore already ignores .cairn/activity/')}`,
  }[ignore];
  console.log(`  ${ignoreMsg}`);
  if (droppedNested)
    console.log(`  ${c.dim('• removed')}   ${c.dim('legacy .cairn/.gitignore (moved to root)')}`);
  if (wroteConfig)
    console.log(
      `  ${c.good('✓ wrote')}    ${c.dim('.cairn/config.json')} ${c.dim(`(commit mode: ${cfg.commitMode})`)}`,
    );
  if (seeded > 0)
    console.log(
      `  ${c.good('✓ seeded')}   ${c.accent(String(seeded))} ${c.dim('starter items — mark them wontdo once you are rolling')}`,
    );
  const hookMsg = {
    created: c.good('✓ installed') + '  ' + c.dim('.git/hooks/post-commit'),
    appended: c.good('✓ appended') + '  ' + c.dim('record-commit to existing post-commit hook'),
    already: c.dim('• present   post-commit hook already records commits'),
    skipped: c.warn('! skipped   could not locate .git/hooks'),
  }[hook];
  console.log(`  ${hookMsg}`);

  if (hooksWarn && !hooksWarn.includes(path.join('.git', 'hooks'))) {
    console.log(
      `\n  ${c.warn('note')} ${c.dim(`a global core.hooksPath is set (${hooksWarn}); the local hook may not run.`)}`,
    );
  }

  console.log('\n  ' + c.heading('Next:'));
  console.log(
    `    ${c.accent('cairn install-skills')}   ${c.dim('— add /cairn-capture /cairn-plan /cairn-sync /cairn-shutdown to Claude Code')}`,
  );
  console.log(
    `    ${c.accent('cairn')}                  ${c.dim('— open the board (left pane); run Claude Code on the right')}`,
  );
  const modeBlurb =
    cfg.commitMode === 'batch'
      ? 'CAIRN batches .cairn/ into one cairn: commit at /cairn-shutdown — keeping code history clean.'
      : cfg.commitMode === 'ride-along'
        ? 'CAIRN writes .cairn/ only; it rides along with your next code commit.'
        : 'CAIRN commits .cairn/ with a cairn: prefix on every board action.';
  console.log(`\n  ${c.dim(`commit mode is ${cfg.commitMode} — ${modeBlurb}`)}`);
  console.log(
    `  ${c.dim('change it any time: ')}${c.accent('cairn config commit-mode <batch|auto|ride-along>')}`,
  );
  console.log('');
}
