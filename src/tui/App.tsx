import { useEffect, useState, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import type { CairnPaths } from '../core/paths.js';
import { advance } from '../core/advance.js';
import { maybeCommit } from '../core/gitCommit.js';
import type { BacklogItem } from '../core/backlog.js';
import { useCairnData } from './useCairnData.js';
import { Header, Rule, Roadmap, Inbox, SkillsLegend, Footer } from './components.js';
import { NextAction, ShipFx, SHIP_FRAMES } from './NextAction.js';
import { palette, clamp } from './theme.js';

function formatClock(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}  ${hh}:${mm}`;
}

function toCard(item: BacklogItem): { id: string; title: string } {
  return { id: item.id, title: item.title };
}

export function App({ paths }: { paths: CairnPaths }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { data, reload } = useCairnData(paths);

  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [phase, setPhase] = useState<'idle' | 'ship'>('idle');
  const [fx, setFx] = useState<ShipFx | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  // Live clock (minute granularity is enough).
  useEffect(() => {
    const iv = setInterval(() => setClock(formatClock(new Date())), 15000);
    return () => clearInterval(iv);
  }, []);

  // Ship celebration animation.
  useEffect(() => {
    if (phase !== 'ship') return;
    let frame = 0;
    const iv = setInterval(() => {
      frame += 1;
      if (frame >= SHIP_FRAMES) {
        clearInterval(iv);
        setPhase('idle');
        setFx(undefined);
        reload();
        return;
      }
      setFx((prev) => (prev ? { ...prev, frame } : prev));
    }, 70);
    return () => clearInterval(iv);
  }, [phase, reload]);

  const flash = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(undefined), 2200);
  }, []);

  const onAdvance = useCallback(() => {
    if (phase === 'ship') return;
    const fromProgress = data.current.progress ?? 0;
    const result = advance(paths);
    if (!result.changed) {
      flash('nothing to advance — run /plan to queue work');
      return;
    }
    setFx({
      shipped: result.shipped,
      next: result.next,
      queueEmpty: result.queueEmpty,
      fromProgress,
      frame: 0,
    });
    setPhase('ship');

    // Persist per the repo's commit mode — cairn: prefix, or ride-along no-op.
    try {
      const subject = result.queueEmpty
        ? `ship ${result.shipped?.id ?? ''} · queue empty`.trim()
        : `ship ${result.shipped?.id ?? ''} · now ${result.next?.id ?? ''}`.trim();
      const commit = maybeCommit(paths, subject);
      if (commit.reason === 'error') flash("couldn't auto-commit .cairn (git identity?)");
    } catch {
      flash("couldn't auto-commit .cairn");
    }
    reload();
  }, [phase, data.current.progress, paths, reload, flash]);

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
      exit();
      return;
    }
    if (input === 'a' || (key.return && phase === 'idle')) {
      onAdvance();
    }
  });

  const cols = stdout?.columns ?? 80;
  const boxWidth = clamp(cols - 1, 56, 92);
  const innerWidth = boxWidth - 4;

  // Derive the views from item status + the queue.
  const now = data.items.filter((i) => i.status === 'now').map(toCard);
  const queueCards = data.queue
    .map((id) => data.byId.get(id))
    .filter((i): i is BacklogItem => Boolean(i))
    .map(toCard);
  const next =
    queueCards.length > 0
      ? queueCards
      : data.items.filter((i) => i.status === 'next').map(toCard);
  const later = data.items.filter((i) => i.status === 'later').map(toCard);
  const inbox = data.items.filter((i) => i.status === 'inbox');

  const activeItem = data.current.id ? data.byId.get(data.current.id) : undefined;
  const progress = data.current.progress ?? 0;

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        width={boxWidth}
        borderStyle="round"
        borderColor={palette.accent}
        paddingX={1}
      >
        <Header repo={data.repo} clock={clock} width={innerWidth} />
        <Rule width={innerWidth} />
        <NextAction
          phase={phase}
          item={activeItem}
          progress={progress}
          width={innerWidth}
          fx={fx}
          shippedToday={data.shippedToday}
        />
        <Rule width={innerWidth} />
        <Roadmap now={now} next={next} later={later} width={innerWidth} />
        <Rule width={innerWidth} />
        <Inbox items={inbox} width={innerWidth} />
        <Rule width={innerWidth} />
        <SkillsLegend skills={data.skills} width={innerWidth} />
      </Box>
      <Footer
        width={boxWidth}
        message={message}
        commitMode={data.commitMode}
        ballotDue={data.ballotDue}
      />
      {data.items.length === 0 && (
        <Box paddingX={2}>
          <Text color={palette.dim}>
            backlog is empty — run <Text color={palette.accent}>/capture</Text> in the Claude pane to
            add your first item
          </Text>
        </Box>
      )}
    </Box>
  );
}
