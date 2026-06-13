import { useEffect, useState, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import type { CairnPaths } from '../core/paths.js';
import { advance } from '../core/advance.js';
import { maybeCommit } from '../core/gitCommit.js';
import type { BacklogItem } from '../core/backlog.js';
import { useCairnData } from './useCairnData.js';
import { Header, Rule, Footer } from './components.js';
import { TabBar, TABS } from './Tabs.js';
import { InboxList, BacklogList, type TypeFilter } from './lists.js';
import { ContentViewer } from './ContentViewer.js';
import { HelpView } from './Help.js';
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

/** Backlog tab shows live work (everything but shipped/wontdo), in roadmap order. */
const BACKLOG_ORDER: Record<string, number> = { now: 0, next: 1, later: 2, inbox: 3 };

export function App({ paths }: { paths: CairnPaths }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { data, reload } = useCairnData(paths);

  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [phase, setPhase] = useState<'idle' | 'ship'>('idle');
  const [fx, setFx] = useState<ShipFx | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const [tab, setTab] = useState(0); // 0 Next · 1 Inbox · 2 Backlog · 3 Help
  const [inboxSel, setInboxSel] = useState(0);
  const [backlogSel, setBacklogSel] = useState(0);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [viewer, setViewer] = useState<{ id: string; scroll: number } | null>(null);
  const [, bumpResize] = useState(0);

  // Live clock (minute granularity is enough).
  useEffect(() => {
    const iv = setInterval(() => setClock(formatClock(new Date())), 15000);
    return () => clearInterval(iv);
  }, []);

  // Re-render on terminal resize so the fullscreen layout re-measures rows/cols.
  useEffect(() => {
    if (!stdout) return;
    const onResize = () => bumpResize((n) => n + 1);
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

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
      flash('nothing to advance — run /cairn-plan to queue work');
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

  const cols = stdout?.columns ?? 80;
  const boxWidth = clamp(cols - 1, 56, 92);
  const innerWidth = boxWidth - 4;
  const rows = stdout?.rows ?? 24;
  // Chrome around the tab content: border (2) + header (2) + 2 rules + tab bar = 8.
  const contentRows = clamp(rows - 8, 4, 60);
  // The reader drops the tab bar/rule but adds its own header + footer rows.
  const viewerRows = clamp(rows - 10, 4, 60);

  // Derive the views from item status + the queue.
  const queueCards = data.queue
    .map((id) => data.byId.get(id))
    .filter((i): i is BacklogItem => Boolean(i))
    .map(toCard);
  const next =
    queueCards.length > 0 ? queueCards : data.items.filter((i) => i.status === 'next').map(toCard);
  const inbox = data.items.filter((i) => i.status === 'inbox');

  const backlogAll = data.items
    .filter((i) => i.status in BACKLOG_ORDER)
    .sort((a, b) => BACKLOG_ORDER[a.status] - BACKLOG_ORDER[b.status]);
  const backlog = filter === 'all' ? backlogAll : backlogAll.filter((i) => i.type === filter);

  const inboxSelC = clamp(inboxSel, 0, Math.max(0, inbox.length - 1));
  const backlogSelC = clamp(backlogSel, 0, Math.max(0, backlog.length - 1));

  const activeItem = data.current.id ? data.byId.get(data.current.id) : undefined;
  const progress = data.current.progress ?? 0;
  const nextCard = next[0];
  const viewerItem = viewer ? data.byId.get(viewer.id) : undefined;

  useInput((input, key) => {
    // The reader overlay captures all input until closed.
    if (viewer) {
      if (key.escape || key.return || input === 'q') setViewer(null);
      else if (key.upArrow || input === 'k')
        setViewer((v) => (v ? { ...v, scroll: Math.max(0, v.scroll - 1) } : v));
      else if (key.downArrow || input === 'j')
        setViewer((v) => (v ? { ...v, scroll: v.scroll + 1 } : v));
      else if (key.pageUp)
        setViewer((v) => (v ? { ...v, scroll: Math.max(0, v.scroll - viewerRows) } : v));
      else if (key.pageDown) setViewer((v) => (v ? { ...v, scroll: v.scroll + viewerRows } : v));
      return;
    }

    if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
      exit();
      return;
    }
    if (key.leftArrow) {
      setTab((t) => (t + TABS.length - 1) % TABS.length);
      return;
    }
    if (key.rightArrow) {
      setTab((t) => (t + 1) % TABS.length);
      return;
    }
    if (input === 'a') {
      setTab(0);
      onAdvance();
      return;
    }
    if (key.return) {
      const target =
        tab === 0
          ? activeItem
          : tab === 1
            ? inbox[inboxSelC]
            : tab === 2
              ? backlog[backlogSelC]
              : undefined;
      if (target) setViewer({ id: target.id, scroll: 0 });
      return;
    }

    if (tab === 1) {
      if (key.upArrow) setInboxSel((s) => Math.max(0, s - 1));
      else if (key.downArrow) setInboxSel((s) => Math.min(inbox.length - 1, s + 1));
      return;
    }
    if (tab === 2) {
      if (key.upArrow) setBacklogSel((s) => Math.max(0, s - 1));
      else if (key.downArrow) setBacklogSel((s) => Math.min(backlog.length - 1, s + 1));
      else if (input === '1') {
        setFilter('all');
        setBacklogSel(0);
      } else if (input === '2') {
        setFilter('core');
        setBacklogSel(0);
      } else if (input === '3') {
        setFilter('feature');
        setBacklogSel(0);
      } else if (input === '4') {
        setFilter('qol');
        setBacklogSel(0);
      } else if (input === '5') {
        setFilter('bug');
        setBacklogSel(0);
      }
    }
  });

  const footerKeys = viewer
    ? '↑/↓ scroll · enter/esc close'
    : tab === 0
      ? '←/→ tabs · a ship · enter read · q quit'
      : tab === 1
        ? '←/→ tabs · ↑/↓ move · enter read · q quit'
        : tab === 2
          ? '←/→ tabs · ↑/↓ move · 1–5 filter · enter read · q quit'
          : '←/→ tabs · q quit';

  return (
    <Box flexDirection="column" width={boxWidth} height={rows}>
      <Box
        flexGrow={1}
        flexDirection="column"
        width={boxWidth}
        borderStyle="round"
        borderColor={palette.accent}
        paddingX={1}
      >
        <Header repo={data.repo} clock={clock} />
        <Rule width={innerWidth} />
        {viewer ? (
          <Box flexGrow={1} flexDirection="column">
            <ContentViewer
              item={viewerItem}
              scroll={viewer.scroll}
              rows={viewerRows}
              width={innerWidth}
            />
          </Box>
        ) : (
          <>
            <TabBar active={tab} inboxCount={inbox.length} width={innerWidth} />
            <Rule width={innerWidth} />
            <Box flexGrow={1} flexDirection="column" overflowY="hidden">
            {tab === 0 && (
              <Box flexDirection="column">
                <NextAction
                  phase={phase}
                  item={activeItem}
                  progress={progress}
                  width={innerWidth}
                  fx={fx}
                  shippedToday={data.shippedToday}
                />
                {phase === 'idle' && (
                  <Box marginTop={1}>
                    <Text color={palette.dim}>{'  next   '}</Text>
                    {nextCard ? (
                      <Text>
                        <Text color={palette.accentDim}>▸ </Text>
                        <Text color={palette.text}>{nextCard.title}</Text>
                      </Text>
                    ) : (
                      <Text color={palette.dim}>nothing queued · /cairn-plan</Text>
                    )}
                  </Box>
                )}
              </Box>
            )}
            {tab === 1 && (
              <InboxList items={inbox} selected={inboxSelC} rows={contentRows} width={innerWidth} />
            )}
            {tab === 2 && (
              <BacklogList
                items={backlog}
                selected={backlogSelC}
                filter={filter}
                rows={contentRows}
                width={innerWidth}
              />
            )}
            {tab === 3 && <HelpView skills={data.skills} width={innerWidth} />}
            </Box>
          </>
        )}
      </Box>
      <Footer
        width={boxWidth}
        message={message}
        commitMode={data.commitMode}
        ballotDue={data.ballotDue}
        keys={footerKeys}
      />
    </Box>
  );
}
