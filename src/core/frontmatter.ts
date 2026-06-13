import YAML from 'yaml';

export interface Parsed {
  data: Record<string, unknown>;
  body: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Split a markdown doc into YAML frontmatter data + body. Tolerant of bad YAML. */
export function parseFrontmatter(raw: string): Parsed {
  const match = FM_RE.exec(raw);
  if (!match) return { data: {}, body: raw };
  return { data: parseBlock(match[1]), body: match[2] ?? '' };
}

function parseBlock(block: string): Record<string, unknown> {
  try {
    const parsed = YAML.parse(block);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    /* strict YAML choked — fall through to the tolerant line parser */
  }
  return parseLoose(block);
}

/**
 * Last-resort line parser for when strict YAML rejects the block — e.g. a value that
 * contains a `: ` (colon-space), which a plain scalar may not. Splits each line on its
 * first colon so no field is dropped; the structured writer re-quotes such values on the
 * next write, so the file self-heals. Without this, a single bad value emptied the whole
 * frontmatter and `updateItemFields` silently destroyed the item (CAIRN-016).
 */
function parseLoose(block: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = /^([A-Za-z0-9_-]+):(?:\s+(.*))?$/.exec(line);
    if (!m) continue;
    const value = (m[2] ?? '').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    data[m[1]] = value;
  }
  return data;
}

/** Re-assemble a markdown doc from frontmatter data + body, preserving key order. */
export function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  const yaml = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  const trimmedBody = body.replace(/^\s+/, '').trimEnd();
  return `---\n${yaml}\n---\n${trimmedBody ? trimmedBody + '\n' : ''}`;
}
