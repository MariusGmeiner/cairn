// Dev smoke tool: render the TUI once to an in-memory stream and print the
// final frame (ANSI stripped) so the layout can be eyeballed without a TTY.
//   node scripts/smoke-render.mjs <repo-with-.cairn> [columns]
import { Writable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { render } from 'ink';
import { createElement } from 'react';
import { cairnPaths } from '../dist/core/paths.js';
import { App } from '../dist/tui/App.js';

const root = process.argv[2] ?? process.cwd();
const paths = cairnPaths(root);

let buf = '';
const out = new Writable({
  write(chunk, _enc, cb) {
    buf += chunk.toString();
    cb();
  },
});
out.columns = Number(process.argv[3] ?? 86);
out.rows = 50;
out.isTTY = true;

// Minimal TTY-ish stdin so Ink's useInput doesn't throw on raw mode.
const stdin = new EventEmitter();
Object.assign(stdin, {
  isTTY: true,
  setRawMode() {},
  setEncoding() {},
  resume() {},
  pause() {},
  ref() {},
  unref() {},
  read() {
    return null;
  },
});

const { unmount } = render(createElement(App, { paths }), {
  stdout: out,
  stdin,
  patchConsole: false,
  exitOnCtrlC: false,
});

setTimeout(() => {
  unmount();
  const clean = buf.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
  const frames = [...clean.matchAll(/╭─{20,}/g)];
  const start = frames.length ? frames[frames.length - 1].index : 0;
  process.stdout.write('\n' + clean.slice(start).replace(/\n{3,}/g, '\n\n') + '\n');
  process.exit(0);
}, 300);
