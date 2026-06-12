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
    title: 'Capture a real idea with /capture',
    summary: 'Run /capture in the Claude Code pane and answer a couple of questions.',
    type: 'feature',
    area: 'onboarding',
    size: 'S',
    status: 'next',
    target: 'a new item file exists in .cairn/backlog/',
  },
  {
    id: 'CAIRN-003',
    title: 'Shape the roadmap with /plan',
    summary: 'Run /plan to refresh Now / Next / Later and pre-compute the queue.',
    type: 'core',
    area: 'onboarding',
    size: 'S',
    status: 'next',
    target: 'queue.md lists your real next steps',
  },
  {
    id: 'CAIRN-004',
    title: 'Delete these starter items',
    summary: 'Once you have the hang of it, remove the CAIRN-00x onboarding items.',
    type: 'qol',
    area: 'onboarding',
    size: 'S',
    status: 'later',
    notes: 'they live in .cairn/backlog/',
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

  for (const dir of [paths.backlog, paths.board, paths.daily, paths.activity]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const wroteGitignore = writeIfAbsent(
    paths.gitignore,
    '# CAIRN local, derived — keep out of git\nactivity/\n',
  );
  const wroteConfig = !fs.existsSync(configPath(paths));
  if (wroteConfig) writeConfig(paths, { commitMode: 'auto' });
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
  console.log(c.heading('\n  ▲ CAIRN initialized') + c.dim(`  ·  ${path.basename(root)}`) + '\n');
  console.log(
    `  ${fresh ? c.good('✓ created') : c.dim('• present')}  ${c.dim('.cairn/')} ${c.dim('(backlog · board · daily · activity)')}`,
  );
  if (wroteGitignore)
    console.log(`  ${c.good('✓ wrote')}    ${c.dim('.cairn/.gitignore')} ${c.dim('(ignores activity/)')}`);
  if (wroteConfig)
    console.log(
      `  ${c.good('✓ wrote')}    ${c.dim('.cairn/config.json')} ${c.dim(`(commit mode: ${cfg.commitMode})`)}`,
    );
  if (seeded > 0)
    console.log(
      `  ${c.good('✓ seeded')}   ${c.accent(String(seeded))} ${c.dim('starter items — delete them once you are rolling')}`,
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
    `    ${c.accent('cairn install-skills')}   ${c.dim('— add /capture /plan /sync /shutdown to Claude Code')}`,
  );
  console.log(
    `    ${c.accent('cairn')}                  ${c.dim('— open the board (left pane); run Claude Code on the right')}`,
  );
  console.log(
    `\n  ${c.dim(`commit mode is ${cfg.commitMode} — CAIRN commits .cairn/ with a cairn: prefix.`)}`,
  );
  console.log(
    `  ${c.dim('prefer your .cairn changes to ride along with code commits? ')}${c.accent('cairn config commit-mode ride-along')}`,
  );
  console.log('');
}
