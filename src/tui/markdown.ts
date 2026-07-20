import { palette } from './theme.js';

/**
 * One styled run of text inside a display row. `href` renders as an OSC-8
 * hyperlink at draw time — the escape is invisible to width measurement, so it
 * is applied after wrapping rather than before.
 */
export type Seg = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  strikethrough?: boolean;
  href?: string;
};

/** A single terminal row: the segments to draw, left to right. */
export type Row = Seg[];

const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```/;
const QUOTE = /^>\s?(.*)$/;
const CHECKBOX = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/;
const BULLET = /^(\s*)[-*]\s+(.*)$/;
const ORDERED = /^(\s*)(\d+[.)])\s+(.*)$/;

/** Inline markers, longest-first so `**` wins over `*`. */
const INLINE: { re: RegExp; seg: (m: RegExpMatchArray) => Seg }[] = [
  { re: /^\[([^\]\n]+)\]\(([^)\s]+)\)/, seg: (m) => ({ text: m[1], color: palette.accent, href: m[2] }) },
  { re: /^`([^`\n]+)`/, seg: (m) => ({ text: m[1], color: palette.accentDim }) },
  { re: /^\*\*([^*\n]+)\*\*/, seg: (m) => ({ text: m[1], bold: true }) },
  { re: /^~~([^~\n]+)~~/, seg: (m) => ({ text: m[1], strikethrough: true, dim: true }) },
  { re: /^\*([^*\n]+)\*/, seg: (m) => ({ text: m[1], italic: true }) },
  { re: /^_([^_\n]+)_/, seg: (m) => ({ text: m[1], italic: true }) },
];

/** Split text into styled runs, stripping the markers themselves. */
export function parseInline(text: string, base: Omit<Seg, 'text'> = {}): Seg[] {
  const out: Seg[] = [];
  let plain = '';
  const flush = () => {
    if (plain !== '') out.push({ ...base, text: plain });
    plain = '';
  };
  let rest = text;
  while (rest.length > 0) {
    const hit = INLINE.map((r) => ({ r, m: rest.match(r.re) })).find((x) => x.m);
    if (hit?.m) {
      flush();
      out.push({ ...base, ...hit.r.seg(hit.m) });
      rest = rest.slice(hit.m[0].length);
    } else {
      plain += rest[0];
      rest = rest.slice(1);
    }
  }
  flush();
  return out.length > 0 ? out : [{ ...base, text: '' }];
}

/** A parsed logical line: a fixed prefix (bullet, gutter) plus styled content. */
type Block = { prefix: Seg[]; segs: Seg[] };

function blockFor(line: string, inFence: boolean, width: number): Block {
  if (inFence) return { prefix: [], segs: [{ text: line, color: palette.accentDim, dim: true }] };

  const heading = line.match(HEADING);
  if (heading) {
    const level = heading[1].length;
    const color = level === 1 ? palette.lit : palette.shadow;
    return { prefix: [], segs: parseInline(heading[2], { color, bold: true }) };
  }
  if (RULE.test(line)) {
    return { prefix: [], segs: [{ text: '─'.repeat(Math.max(0, width)), color: palette.rule }] };
  }

  const quote = line.match(QUOTE);
  if (quote) return { prefix: [{ text: '│ ', color: palette.rule }], segs: parseInline(quote[1], { dim: true }) };

  const check = line.match(CHECKBOX);
  if (check) {
    const done = check[2].toLowerCase() === 'x';
    return {
      prefix: [{ text: check[1] }, { text: done ? '☑ ' : '☐ ', color: done ? palette.good : palette.accent }],
      segs: parseInline(check[3], done ? { dim: true } : {}),
    };
  }

  const bullet = line.match(BULLET);
  if (bullet) {
    return { prefix: [{ text: bullet[1] }, { text: '· ', color: palette.accent }], segs: parseInline(bullet[2]) };
  }

  const ordered = line.match(ORDERED);
  if (ordered) {
    return {
      prefix: [{ text: ordered[1] }, { text: `${ordered[2]} `, color: palette.accentDim }],
      segs: parseInline(ordered[3]),
    };
  }
  return { prefix: [], segs: parseInline(line) };
}

const segWidth = (segs: Seg[]) => segs.reduce((n, s) => n + s.text.length, 0);

/**
 * Flow styled segments into rows no wider than `width`, breaking on whitespace and
 * hard-breaking over-long tokens. The plain-text `wrapText` in theme.ts can't do
 * this: it measures the raw line, so markers would count toward the width.
 */
function wrapSegs(segs: Seg[], width: number): Row[] {
  if (width <= 0) return [segs];
  const rows: Row[] = [];
  let row: Row = [];
  let col = 0;
  const push = () => {
    // Trailing whitespace must not survive: a row padded to exactly `width` fills the
    // terminal's last column, and Ink re-wraps it onto a second physical line — which
    // silently shifts every following row and eats the top of the view.
    while (row.length > 0 && /^\s*$/.test(row[row.length - 1].text)) row.pop();
    const last = row[row.length - 1];
    if (last) row[row.length - 1] = { ...last, text: last.text.replace(/\s+$/, '') };
    rows.push(row.length > 0 ? row : [{ text: '' }]);
    row = [];
    col = 0;
  };
  for (const seg of segs) {
    for (let token of seg.text.split(/(\s+)/)) {
      if (token === '') continue;
      if (col > 0 && col + token.length > width) {
        push();
        if (/^\s+$/.test(token)) continue;
      }
      while (col + token.length > width) {
        row.push({ ...seg, text: token.slice(0, width - col) });
        token = token.slice(width - col);
        push();
      }
      row.push({ ...seg, text: token });
      col += token.length;
    }
  }
  push();
  return rows;
}

/** True for a line that continues the block above rather than starting its own. */
function isContinuation(line: string): boolean {
  if (line.trim() === '') return false;
  return !HEADING.test(line) && !RULE.test(line) && !QUOTE.test(line) && !BULLET.test(line) && !ORDERED.test(line);
}

/**
 * Join soft-wrapped source lines back into logical blocks. A markdown file wraps its
 * paragraphs at whatever column the author typed; re-wrapping each source line on its
 * own leaves the overflow word stranded on a short line of its own. Reflowing first
 * means text fills each row and only breaks where it genuinely has to.
 */
function toBlocks(body: string): { text: string; fenced: boolean }[] {
  const blocks: { text: string; fenced: boolean }[] = [];
  let inFence = false;
  for (const line of body.replace(/\r\n/g, '\n').split('\n')) {
    if (FENCE.test(line)) {
      blocks.push({ text: line, fenced: true });
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      blocks.push({ text: line, fenced: true });
      continue;
    }
    const prev = blocks[blocks.length - 1];
    // A heading or rule closes its block, so the next line can never be absorbed into it.
    const open = prev && !prev.fenced && prev.text.trim() !== '' && !HEADING.test(prev.text) && !RULE.test(prev.text);
    if (open && isContinuation(line)) {
      blocks[blocks.length - 1] = { text: `${prev.text} ${line.trim()}`, fenced: false };
      continue;
    }
    blocks.push({ text: line, fenced: false });
  }
  return blocks;
}

/**
 * Render a markdown body into styled terminal rows of at most `width` columns.
 * Continuation rows of a prefixed line (bullet, quote) are indented to match.
 */
export function renderBody(body: string, width: number): Row[] {
  const out: Row[] = [];
  for (const { text: line, fenced } of toBlocks(body)) {
    const block = blockFor(line, fenced, width);
    const indent = segWidth(block.prefix);
    const wrapped = wrapSegs(block.segs, Math.max(1, width - indent));
    wrapped.forEach((row, i) => {
      const lead = i === 0 ? block.prefix : indent > 0 ? [{ text: ' '.repeat(indent) }] : [];
      out.push([...lead, ...row]);
    });
  }
  while (out.length > 0 && segWidth(out[0]) === 0) out.shift();
  while (out.length > 0 && segWidth(out[out.length - 1]) === 0) out.pop();
  return out;
}
