import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { bundledSkillsDir, userSkillsDir } from './paths.js';

export interface SkillInfo {
  name: string;
  description: string;
  /** true when read from the user-global ~/.claude/skills, false when from the bundle. */
  installed: boolean;
}

/** Preferred display order; unknown skills sort after, alphabetically. */
const ORDER = ['cairn-capture', 'cairn-intake', 'cairn-plan', 'cairn-sync', 'cairn-shutdown', 'cairn-ballot', 'cairn-loop'];

function orderRank(name: string): number {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length + 1 : i;
}

function readSkillsFrom(dir: string, installed: boolean): SkillInfo[] {
  if (!fs.existsSync(dir)) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const skills: SkillInfo[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(dir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    let raw: string;
    try {
      raw = fs.readFileSync(skillFile, 'utf8');
    } catch {
      continue;
    }
    const { data } = parseFrontmatter(raw);
    const name = data.name != null ? String(data.name) : entry.name;
    const description = data.description != null ? String(data.description) : '';
    skills.push({ name, description, installed });
  }
  return skills;
}

/**
 * Skills legend source. Reads the user-global skills first (the spec's source of
 * truth) and falls back to the bundled copies so the legend is never empty.
 */
export function loadSkillLegend(): SkillInfo[] {
  const installed = readSkillsFrom(userSkillsDir(), true);
  const known = new Set(installed.map((s) => s.name));
  const bundled = readSkillsFrom(bundledSkillsDir(), false).filter((s) => !known.has(s.name));
  return [...installed, ...bundled].sort((a, b) => {
    const r = orderRank(a.name) - orderRank(b.name);
    return r !== 0 ? r : a.name.localeCompare(b.name);
  });
}
