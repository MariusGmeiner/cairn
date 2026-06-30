import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { advance } from '../dist/core/advance.js';
import { cairnPaths } from '../dist/core/paths.js';

/**
 * Regression: a freshly-planned queue can carry the active item at its head, so
 * current.id === queue[0]. advance() must ship the current item, SKIP that stale
 * duplicate when popping, and promote the genuine next item — not crash trying to
 * re-stat the just-archived backlog file (the original ENOENT bug).
 */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cairn-advance-'));
  const p = cairnPaths(root);
  fs.mkdirSync(p.backlog, { recursive: true });
  fs.mkdirSync(p.board, { recursive: true });
  fs.mkdirSync(p.activity, { recursive: true });
  const item = (id, status, target) =>
    fs.writeFileSync(
      path.join(p.backlog, `${id}.md`),
      `---\nid: ${id}\ntitle: ${id}\nstatus: ${status}\ntarget: ${target}\n---\nbody\n`,
    );
  item('FAB-018', 'now', 'ship the skeleton');
  item('FAB-019', 'next', 'ship the effects');
  fs.writeFileSync(p.current, `---\nid: FAB-018\ntarget: ship the skeleton\nprogress: 0\n---\n\n# FAB-018\n`);
  fs.writeFileSync(p.queue, '# Queue\n\n- FAB-018 · Skeleton\n- FAB-019 · Effects\n');
  return { root, p };
}

test('advance skips the just-shipped item when it sits at the queue head', () => {
  const { root, p } = fixture();
  try {
    const result = advance(p); // must not throw

    assert.equal(result.shipped?.id, 'FAB-018');
    assert.equal(result.next?.id, 'FAB-019');

    // FAB-018 archived as shipped, gone from the live backlog.
    assert.ok(fs.existsSync(path.join(p.archive, 'FAB-018.md')));
    assert.ok(!fs.existsSync(path.join(p.backlog, 'FAB-018.md')));
    assert.match(fs.readFileSync(path.join(p.archive, 'FAB-018.md'), 'utf8'), /status: shipped/);

    // FAB-019 is now the active action.
    assert.match(fs.readFileSync(p.current, 'utf8'), /id: FAB-019/);
    assert.match(fs.readFileSync(path.join(p.backlog, 'FAB-019.md'), 'utf8'), /status: now/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
