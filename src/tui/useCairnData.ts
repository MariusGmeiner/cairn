import { useEffect, useState, useCallback, useRef } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import chokidar from 'chokidar';
import { readBacklog, indexById, BacklogItem } from '../core/backlog.js';
import { readCurrent, readQueue, CurrentAction } from '../core/board.js';
import { readActivity, shippedToday } from '../core/activity.js';
import { loadSkillLegend, SkillInfo } from '../core/skills.js';
import { readConfig, ballotDue, type CommitMode } from '../core/config.js';
import { userSkillsDir, type CairnPaths } from '../core/paths.js';

export interface CairnData {
  repo: string;
  items: BacklogItem[];
  byId: Map<string, BacklogItem>;
  current: CurrentAction;
  queue: string[];
  skills: SkillInfo[];
  shippedToday: number;
  commitMode: CommitMode;
  ballotDue: boolean;
  loadedAt: Date;
}

function load(paths: CairnPaths): CairnData {
  const items = readBacklog(paths.backlog);
  const activity = readActivity(paths.activityLog);
  const config = readConfig(paths);
  return {
    repo: path.basename(paths.root),
    items,
    byId: indexById(items),
    current: readCurrent(paths.current),
    queue: readQueue(paths.queue),
    skills: loadSkillLegend(),
    shippedToday: shippedToday(activity),
    commitMode: config.commitMode,
    ballotDue: ballotDue(config),
    loadedAt: new Date(),
  };
}

/** Load the repo's .cairn data and keep it live via chokidar. */
export function useCairnData(paths: CairnPaths): { data: CairnData; reload: () => void } {
  const [data, setData] = useState<CairnData>(() => load(paths));
  const timer = useRef<NodeJS.Timeout | null>(null);

  const reload = useCallback(() => {
    setData(load(paths));
  }, [paths]);

  useEffect(() => {
    const debouncedReload = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(reload, 80);
    };

    const watchPaths = [paths.cairn];
    const skillsDir = userSkillsDir();
    if (fs.existsSync(skillsDir)) watchPaths.push(skillsDir);

    const watcher = chokidar.watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      awaitWriteFinish: { stabilityThreshold: 60, pollInterval: 20 },
    });
    watcher.on('all', debouncedReload);
    watcher.on('error', () => {
      /* swallow watcher errors — display keeps last good data */
    });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      void watcher.close();
    };
  }, [paths, reload]);

  return { data, reload };
}
