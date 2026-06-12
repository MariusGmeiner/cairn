import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter.js';

export type ItemType = 'core' | 'qol' | 'bug' | 'feature';
export type ItemStatus = 'inbox' | 'later' | 'next' | 'now' | 'shipped' | 'wontdo';
export type ItemSize = 'S' | 'M' | 'L';

export const ITEM_TYPES: ItemType[] = ['core', 'qol', 'bug', 'feature'];
export const ITEM_SIZES: ItemSize[] = ['S', 'M', 'L'];

export interface BacklogItem {
  id: string;
  title: string;
  summary?: string;
  requested_by?: string;
  date?: string;
  type: ItemType;
  area?: string;
  benefits?: string;
  size?: ItemSize;
  status: ItemStatus;
  target?: string;
  notes?: string;
  body: string;
  file: string;
}

function asString(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function normalizeType(v: unknown): ItemType {
  const s = String(v ?? '').toLowerCase();
  return (ITEM_TYPES as string[]).includes(s) ? (s as ItemType) : 'feature';
}

function normalizeSize(v: unknown): ItemSize | undefined {
  const s = String(v ?? '').toUpperCase();
  return (ITEM_SIZES as string[]).includes(s) ? (s as ItemSize) : undefined;
}

const STATUSES: ItemStatus[] = ['inbox', 'later', 'next', 'now', 'shipped', 'wontdo'];
function normalizeStatus(v: unknown): ItemStatus {
  const s = String(v ?? '').toLowerCase();
  return (STATUSES as string[]).includes(s) ? (s as ItemStatus) : 'inbox';
}

/** Read and parse every backlog item file. Skips unreadable files rather than throwing. */
export function readBacklog(backlogDir: string): BacklogItem[] {
  if (!fs.existsSync(backlogDir)) return [];
  let files: string[];
  try {
    files = fs.readdirSync(backlogDir).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const items: BacklogItem[] = [];
  for (const f of files) {
    const file = path.join(backlogDir, f);
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const { data, body } = parseFrontmatter(raw);
    const id = asString(data.id) ?? path.basename(f, '.md');
    items.push({
      id,
      title: asString(data.title) ?? id,
      summary: asString(data.summary),
      requested_by: asString(data.requested_by),
      date: asString(data.date),
      type: normalizeType(data.type),
      area: asString(data.area),
      benefits: asString(data.benefits),
      size: normalizeSize(data.size),
      status: normalizeStatus(data.status),
      target: asString(data.target),
      notes: asString(data.notes),
      body,
      file,
    });
  }
  return items;
}

export function indexById(items: BacklogItem[]): Map<string, BacklogItem> {
  return new Map(items.map((i) => [i.id, i] as const));
}

/** Patch frontmatter fields on an item file in place, preserving body + key order. */
export function updateItemFields(file: string, patch: Record<string, unknown>): void {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const next: Record<string, unknown> = { ...data };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete next[k];
    else next[k] = v;
  }
  fs.writeFileSync(file, stringifyFrontmatter(next, body));
}
