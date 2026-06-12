import { readBacklog, indexById, updateItemFields, BacklogItem } from './backlog.js';
import { readCurrent, writeCurrent, readQueue, writeQueue } from './board.js';
import { appendActivity } from './activity.js';
import { readConfig, updateConfig } from './config.js';
import type { CairnPaths } from './paths.js';

export interface AdvanceResult {
  shipped?: { id: string; title: string; target?: string };
  next?: { id: string; title: string; target?: string };
  queueEmpty: boolean;
  /** false when there was nothing to ship and the queue was already empty. */
  changed: boolean;
}

function today(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Deterministic "advance to next action." No model involved:
 *   1. mark the current item shipped + log it
 *   2. pop the next id from the queue and make it the active action
 * Safe to call with an empty board (no-op, changed=false).
 */
export function advance(paths: CairnPaths, now: Date = new Date()): AdvanceResult {
  const items = readBacklog(paths.backlog);
  const byId = indexById(items);
  const titleOf = (id: string): string | undefined => byId.get(id)?.title;

  const current = readCurrent(paths.current);
  let shipped: AdvanceResult['shipped'];

  if (current.id) {
    const item = byId.get(current.id);
    const title = item?.title ?? current.id;
    const target = current.target ?? item?.target;
    if (item) {
      updateItemFields(item.file, { status: 'shipped', shipped: today(now) });
    }
    shipped = { id: current.id, title, target };
    appendActivity(paths.activityLog, {
      ts: now.toISOString(),
      event: 'ship',
      id: current.id,
      title,
      target,
    });

    // If the just-shipped item is the one the team voted for, pull the next vote
    // forward to the Monday after today.
    try {
      const cfg = readConfig(paths);
      if (cfg.votedFeature === current.id && !cfg.votedFeatureShipped) {
        updateConfig(paths, { votedFeatureShipped: today(now) });
      }
    } catch {
      /* config is best-effort; never block an advance */
    }
  }

  const queue = readQueue(paths.queue);
  const nextId = queue.shift();

  if (!nextId) {
    writeCurrent(paths.current, {});
    writeQueue(paths.queue, [], titleOf);
    return { shipped, queueEmpty: true, changed: Boolean(shipped) };
  }

  const nextItem: BacklogItem | undefined = byId.get(nextId);
  if (nextItem) {
    updateItemFields(nextItem.file, { status: 'now' });
  }
  writeCurrent(paths.current, {
    id: nextId,
    target: nextItem?.target,
    progress: 0,
    started: today(now),
    body: '',
  });
  writeQueue(paths.queue, queue, titleOf);

  return {
    shipped,
    next: { id: nextId, title: nextItem?.title ?? nextId, target: nextItem?.target },
    queueEmpty: false,
    changed: true,
  };
}
