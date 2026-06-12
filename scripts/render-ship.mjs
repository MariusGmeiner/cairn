// Dev tool: render the refined ship animation (CAIRN-006) at several frames so the
// layout + eased fill can be eyeballed, and print the frame-colour ramp numerically
// (colours can't survive an ANSI strip, so we show the hex values too).
//   node scripts/render-ship.mjs
import { Writable } from 'node:stream';
import { render, Box, Text } from 'ink';
import { createElement as h } from 'react';
import { NextAction } from '../dist/tui/NextAction.js';

const W = 64;
const item = {
  id: 'CAIRN-006',
  title: 'Refine ship animation + animated green frame',
  type: 'qol',
  area: 'tui',
  status: 'now',
  target: 'eased fill + dark→bright green frame, settling at palette.good',
  body: '',
  file: '',
};
const fx = (frame) => ({
  shipped: { id: 'CAIRN-006', title: 'Refine ship animation + animated green frame' },
  next: { id: 'CAIRN-004', title: 'Delete these starter items' },
  queueEmpty: false,
  fromProgress: 40,
  frame,
});

const specs = [
  ['idle (40%)', { phase: 'idle', item, progress: 40, width: W, shippedToday: 3 }],
  ['ship · frame 0', { phase: 'ship', item, progress: 40, width: W, fx: fx(0), shippedToday: 3 }],
  ['ship · frame 3', { phase: 'ship', item, progress: 40, width: W, fx: fx(3), shippedToday: 3 }],
  ['ship · frame 6', { phase: 'ship', item, progress: 40, width: W, fx: fx(6), shippedToday: 3 }],
  ['ship · frame 9 (settle)', { phase: 'ship', item, progress: 40, width: W, fx: fx(9), shippedToday: 3 }],
  ['ship · frame 14', { phase: 'ship', item, progress: 40, width: W, fx: fx(14), shippedToday: 3 }],
];

const tree = h(
  Box,
  { flexDirection: 'column' },
  specs.flatMap(([label, props], i) => [
    h(Text, { key: 'l' + i, color: 'gray' }, '── ' + label + ' ──'),
    h(NextAction, { key: 'n' + i, ...props }),
    h(Text, { key: 'sp' + i }, ' '),
  ]),
);

// Mirror the in-component math for the printed ramp table.
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const greenRamp = (t) =>
  `#${toHex(12 + (92 - 12) * t)}${toHex(42 + (236 - 42) * t)}${toHex(22 + (110 - 22) * t)}`;
const FILL_FRAMES = 9;

let buf = '';
const out = new Writable({ write(c, _e, cb) { buf += c.toString(); cb(); } });
out.columns = 80;
out.rows = 300;
out.isTTY = true;
const { unmount } = render(tree, { stdout: out, patchConsole: false });

setTimeout(() => {
  unmount();
  const clean = buf.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
  process.stdout.write('\n' + clean + '\n');
  process.stdout.write('frame   fill%   frame-border colour\n');
  process.stdout.write('idle      40    #0c2a16  (resting dark green)\n');
  for (let f = 0; f <= FILL_FRAMES; f++) {
    const t = easeOutCubic(Math.min(1, f / FILL_FRAMES));
    const shown = Math.round(40 + (100 - 40) * t);
    const col = t >= 1 ? 'palette.good (greenBright, settle)' : greenRamp(t);
    process.stdout.write(`${String(f).padEnd(6)}  ${String(shown).padStart(4)}    ${col}\n`);
  }
  process.exit(0);
}, 250);
