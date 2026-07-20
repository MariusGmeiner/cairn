import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBody } from '../dist/tui/markdown.js';

const plain = (row) => row.map((s) => s.text).join('');
const widest = (rows, width) => rows.every((r) => plain(r).length <= width);

test('headings render in cairn blue, bold, with the hashes stripped', () => {
  const [h1, h2] = renderBody('# Title\n## Sub', 40);
  assert.equal(plain(h1), 'Title');
  assert.equal(h1[0].bold, true);
  assert.equal(h1[0].color, 'cyanBright');
  assert.equal(h2[0].color, 'blue');
});

test('inline markers are stripped and do not count toward the wrap width', () => {
  // 30 chars of visible text: fits on one row only if the ** markers are gone first.
  const rows = renderBody('**aaaaaaaaaa bbbbbbbbbb cccccccc**', 30);
  assert.equal(rows.length, 1);
  assert.equal(plain(rows[0]), 'aaaaaaaaaa bbbbbbbbbb cccccccc');
  assert.ok(rows[0].every((s) => s.bold));
});

test('soft-wrapped source lines reflow into full rows, not stranded words', () => {
  // Authored wrapped at ~95 cols; rendered at 88 the last word must not get its own line.
  const body = "On add/change of a booking's rate (GCA bookings only), before saving, check whether the booking\nnow spans 12 or more consecutive calendar weeks from its start date.";
  const rows = renderBody(body, 88).map(plain);
  assert.ok(rows.every((r) => r.length <= 88));
  assert.ok(rows[1].length > 20, `second row stranded: |${rows[1]}|`);
  assert.equal(rows.join(' ').replace(/\s+/g, ' '), body.replace(/\s+/g, ' '));
});

test('a blank line still separates paragraphs', () => {
  const rows = renderBody('one\n\ntwo', 40).map(plain);
  assert.deepEqual(rows, ['one', '', 'two']);
});

test('bullets get a glyph and continuation rows stay indented under it', () => {
  const rows = renderBody('- alpha beta gamma delta', 12);
  assert.equal(plain(rows[0]), '· alpha beta');
  assert.equal(plain(rows[1]).slice(0, 2), '  ');
  assert.ok(widest(rows, 12));
});

test('links keep the label only, carrying the url as href', () => {
  const [row] = renderBody('see [docs](https://example.com/very/long/url)', 40);
  assert.equal(plain(row), 'see docs');
  assert.equal(row.at(-1).href, 'https://example.com/very/long/url');
});

test('fenced blocks are left literal — no inline parsing inside', () => {
  const rows = renderBody('```\n**not bold**\n```', 40);
  assert.equal(plain(rows[1]), '**not bold**');
  assert.equal(rows[1][0].bold, undefined);
});

test('checkboxes render glyphs and dim when done', () => {
  const [todo, done] = renderBody('- [ ] open\n- [x] shipped', 40);
  assert.equal(plain(todo), '☐ open');
  assert.equal(plain(done), '☑ shipped');
  assert.equal(done.at(-1).dim, true);
});

/**
 * Regression: a row could end with a space at exactly `width`, filling the terminal's
 * last column. Ink then re-wrapped it onto a second physical line, shifting every row
 * after it — which showed up as the first line of the body losing its first characters.
 */
test('no row ends in whitespace or reaches past the width', () => {
  const body = "On add/change of a booking's rate (GCA bookings only), before saving, check whether the booking\nnow spans 12 or more **consecutive calendar weeks** from its start date.";
  for (const width of [40, 60, 86, 87, 88, 89, 90]) {
    for (const row of renderBody(body, width)) {
      const text = plain(row);
      assert.ok(text.length <= width, `row ${text.length} > width ${width}`);
      assert.ok(text === '' || !/\s$/.test(text), `trailing space at width ${width}: |${text}|`);
    }
  }
});

test('over-long unbroken tokens hard-break instead of overflowing', () => {
  const rows = renderBody('x'.repeat(25), 10);
  assert.ok(widest(rows, 10));
  assert.equal(rows.map(plain).join(''), 'x'.repeat(25));
});
