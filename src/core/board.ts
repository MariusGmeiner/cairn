import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter.js';

export interface CurrentAction {
  exists: boolean;
  id?: string;
  target?: string;
  progress?: number;
  started?: string;
  body: string;
}

const ID_RE = /([A-Za-z][A-Za-z0-9]*-\d+)/;

function clampProgress(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Read board/current.md — the single active next action. */
export function readCurrent(currentPath: string): CurrentAction {
  if (!fs.existsSync(currentPath)) return { exists: false, body: '' };
  let raw: string;
  try {
    raw = fs.readFileSync(currentPath, 'utf8');
  } catch {
    return { exists: false, body: '' };
  }
  const { data, body } = parseFrontmatter(raw);
  const id = data.id != null && String(data.id).trim() !== '' ? String(data.id).trim() : undefined;
  const target =
    data.target != null && String(data.target).trim() !== '' ? String(data.target).trim() : undefined;
  return {
    exists: true,
    id,
    target,
    progress: clampProgress(data.progress),
    started: data.started != null ? String(data.started) : undefined,
    body: body.trim(),
  };
}

/** Write board/current.md from a CurrentAction. An action with no id renders an "empty" board. */
export function writeCurrent(currentPath: string, action: Partial<CurrentAction>): void {
  fs.mkdirSync(path.dirname(currentPath), { recursive: true });
  if (!action.id) {
    const body =
      '# No active action\n\nThe queue is empty. Run `/cairn-plan` in the Claude Code pane to choose what is next.\n';
    fs.writeFileSync(currentPath, body);
    return;
  }
  const data: Record<string, unknown> = {
    id: action.id,
    target: action.target ?? '',
    progress: action.progress ?? 0,
    started: action.started,
  };
  if (data.started === undefined) delete data.started;
  fs.writeFileSync(currentPath, stringifyFrontmatter(data, action.body ?? ''));
}

/** Read board/queue.md — ordered upcoming item ids. Tolerant of Obsidian list formatting. */
export function readQueue(queuePath: string): string[] {
  if (!fs.existsSync(queuePath)) return [];
  let raw: string;
  try {
    raw = fs.readFileSync(queuePath, 'utf8');
  } catch {
    return [];
  }
  const ids: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('<!--')) continue;
    const m = ID_RE.exec(trimmed);
    if (m && !ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

/** Re-render board/queue.md from ordered ids, decorating with titles when known. */
export function writeQueue(
  queuePath: string,
  ids: string[],
  titleOf?: (id: string) => string | undefined,
): void {
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  const lines = ['# Queue', '<!-- ordered upcoming items · pre-computed by /cairn-plan -->', ''];
  if (ids.length === 0) {
    lines.push('_(empty — run `/cairn-plan` to refill)_');
  } else {
    for (const id of ids) {
      const title = titleOf?.(id);
      lines.push(title ? `- ${id} · ${title}` : `- ${id}`);
    }
  }
  fs.writeFileSync(queuePath, lines.join('\n') + '\n');
}
