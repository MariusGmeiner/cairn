import { test } from 'node:test';
import assert from 'node:assert/strict';
import { footerLayout } from '../dist/tui/components.js';

const total = (l) => l.left.length + l.live.length + l.mode.length + l.lead + l.center.length + l.tail + l.keyHint.length;

/**
 * Regression: the footer sits outside the frame in a fixed-height Box. One column of
 * overflow made Ink wrap it onto a second line, pushing the frame past the terminal
 * height — and flexbox then squeezed that line back out of the boxes above, dropping
 * the header's "Project:" line and slicing the first character off the reader's first
 * body row. Hence: the parts must always total exactly `width`, never more.
 */
test('the footer fits exactly, whatever it is asked to show', () => {
  const cases = [
    {},
    { commitMode: 'batch' },
    { commitMode: 'batch', ballotDue: true, keys: '↑/↓ scroll · enter/esc close' },
    { commitMode: 'ride-along', ballotDue: true, keys: '←/→ tabs · ↑/↓ move · 1–5 filter · enter read · q quit' },
    { commitMode: 'batch', message: "couldn't auto-commit .cairn (git identity?)", keys: '↑/↓ scroll · enter/esc close' },
    { commitMode: 'batch', message: 'x'.repeat(200), keys: 'y'.repeat(200) },
  ];
  for (const width of [56, 72, 88, 92, 140, 240]) {
    for (const props of cases) {
      const layout = footerLayout(width, props);
      assert.equal(total(layout), width, `width=${width} props=${JSON.stringify(props)}`);
    }
  }
});

test('the key hint survives when there is room, and yields when there is not', () => {
  const roomy = footerLayout(92, { commitMode: 'batch', keys: '↑/↓ scroll · enter/esc close' });
  assert.ok(roomy.keyHint.includes('enter/esc close'));
  const cramped = footerLayout(56, { commitMode: 'batch', ballotDue: true, keys: 'z'.repeat(80) });
  assert.equal(cramped.center, '', 'transient message yields before the key hint');
  assert.equal(total(cramped), 56);
});
