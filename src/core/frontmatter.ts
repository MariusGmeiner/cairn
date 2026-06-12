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
  let data: Record<string, unknown> = {};
  try {
    const parsed = YAML.parse(match[1]);
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    data = {};
  }
  return { data, body: match[2] ?? '' };
}

/** Re-assemble a markdown doc from frontmatter data + body, preserving key order. */
export function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  const yaml = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  const trimmedBody = body.replace(/^\s+/, '').trimEnd();
  return `---\n${yaml}\n---\n${trimmedBody ? trimmedBody + '\n' : ''}`;
}
