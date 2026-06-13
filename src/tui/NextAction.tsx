import React from 'react';
import { pathToFileURL } from 'node:url';
import { Box, Text } from 'ink';
import type { BacklogItem } from '../core/backlog.js';
import { palette, typeStyle, progressBar, progressColor, truncate, clamp, link } from './theme.js';

export const SHIP_FRAMES = 36;
const FILL_FRAMES = 18; // frames over which the bar eases to 100

export interface ShipFx {
  shipped?: { id: string; title: string; target?: string };
  next?: { id: string; title: string; target?: string };
  nextType?: BacklogItem['type'];
  queueEmpty: boolean;
  fromProgress: number;
  frame: number;
}

// ── motion + colour helpers ──────────────────────────────────────────────────

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const toHex = (n: number): string =>
  Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** Very dark green → bright green as t goes 0→1 (truecolor; degrades to ANSI green). */
function greenRamp(t: number): string {
  return `#${toHex(lerp(12, 92, t))}${toHex(lerp(42, 236, t))}${toHex(lerp(22, 110, t))}`;
}

/** Muted green for the off-beat sparkles (calmer than grey, less flicker). */
const SPARK_SOFT = '#2f7d4e';

const SPARKLES = ['✦', '✶', '✷', '✺', '✦', '✸'];

function SparkleRow({ frame, width, count }: { frame: number; width: number; count: number }) {
  const cells = clamp(Math.floor(width / 4), 6, 14);
  const wave = Math.floor(frame / 2); // advance the shimmer every 2 frames, not every frame
  const glyphs: React.ReactNode[] = [];
  for (let i = 0; i < cells; i++) {
    const bright = (i + wave) % 3 === 0;
    const g = SPARKLES[(i + wave) % SPARKLES.length];
    glyphs.push(
      <Text key={i} color={bright ? palette.good : SPARK_SOFT}>
        {g}{' '}
      </Text>,
    );
  }
  return (
    <Box>
      {glyphs}
      <Text color={palette.good} bold>
        {`  ${count} shipped today`}
      </Text>
    </Box>
  );
}

function HeaderRow({ right }: { right?: React.ReactNode }) {
  return (
    <Box justifyContent="space-between">
      <Text color={palette.heading} bold>
        NEXT ACTION
      </Text>
      {right}
    </Box>
  );
}

/**
 * The completion affordance while idle — a plain hint, deliberately not a button. The
 * ✓ and "done" appear only during the ship animation (see Shipping), so the checkmark
 * always means "shipped", never "click me".
 */
function DoneHint() {
  return (
    <Box marginTop={1}>
      <Text color={palette.dim}>{'   press '}</Text>
      <Text color={palette.accent} bold>
        a
      </Text>
      <Text color={palette.dim}>{' to mark shipped   ·   '}</Text>
      <Text color={palette.accent} bold>
        v
      </Text>
      <Text color={palette.dim}>{' to read the full item'}</Text>
    </Box>
  );
}

/** Top row of the idle Next view: the section label, the clickable id, the type badge. */
function ActiveHeader({ item }: { item: BacklogItem }) {
  const s = typeStyle[item.type];
  return (
    <Box justifyContent="space-between">
      <Text color={palette.heading} bold>
        NEXT ACTION
      </Text>
      <Box>
        <Text color={palette.accentDim} underline>
          {link(item.id, pathToFileURL(item.file).href)}
        </Text>
        <Text color={palette.dim}>{'  '}</Text>
        <Text color={s.color} bold>
          {s.badge}
        </Text>
      </Box>
    </Box>
  );
}

function Idle({ item, progress, width }: { item?: BacklogItem; progress: number; width: number }) {
  if (!item) {
    return (
      <Box flexDirection="column">
        <HeaderRow />
        <Box marginTop={1}>
          <Text color={palette.accent}>▸ </Text>
          <Text color={palette.heading} bold>
            nothing queued
          </Text>
        </Box>
        <Text color={palette.dim}>
          {'   run '}
          <Text color={palette.accent}>/cairn-plan</Text>
          {' in the Claude Code pane to choose what is next'}
        </Text>
      </Box>
    );
  }
  return (
    <Box flexDirection="column">
      <ActiveHeader item={item} />
      <Box marginTop={1}>
        <Text color={palette.accent} bold>
          ▸{' '}
        </Text>
        <Text color={palette.heading} bold>
          {item.title}
        </Text>
      </Box>
      {item.target && (
        <Box width={width}>
          <Text>
            <Text color={palette.dim}>{'   target '}</Text>
            <Text color={palette.accentDim}>▸ </Text>
            <Text color={palette.text}>{item.target}</Text>
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text>{'   '}</Text>
        <Text color={progressColor(progress)}>{progressBar(progress, 16)}</Text>
        <Text color={palette.dim}>{`  ${progress}%`}</Text>
      </Box>
      <DoneHint />
    </Box>
  );
}

function Shipping({
  fx,
  width,
  streak,
  shown,
  reveal,
}: {
  fx: ShipFx;
  width: number;
  streak: number;
  shown: number;
  reveal: boolean;
}) {
  const title = fx.shipped?.title ?? 'action';
  const id = fx.shipped?.id ?? '';
  const titleW = Math.max(10, width - 6);
  return (
    <Box flexDirection="column">
      <HeaderRow
        right={
          <Text color={palette.good} bold>
            ✓ SHIPPED
          </Text>
        }
      />
      <Box marginTop={1}>
        <Text color={palette.good} bold>
          ✓{' '}
        </Text>
        <Text color={palette.heading} bold>
          {truncate(title, titleW)}
        </Text>
        <Text color={palette.dim}>{id ? `  ${id}` : ''}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{'   '}</Text>
        <Text color={palette.good}>{progressBar(shown, 16)}</Text>
        <Text color={palette.good} bold>
          {shown >= 100 ? '  done' : `  ${shown}%`}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>{'   '}</Text>
        <SparkleRow frame={fx.frame} width={width} count={streak} />
      </Box>
      {reveal && (
        <Box marginTop={1}>
          <Text color={palette.dim}>{'   next '}</Text>
          {fx.queueEmpty ? (
            <Text color={palette.warn}>queue empty — run /cairn-plan</Text>
          ) : (
            <Text>
              <Text color={palette.accent}>▸ </Text>
              <Text color={palette.heading} bold>
                {truncate(fx.next?.title ?? '', titleW)}
              </Text>
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export function NextAction({
  phase,
  item,
  progress,
  width,
  fx,
  shippedToday,
}: {
  phase: 'idle' | 'ship';
  item?: BacklogItem;
  progress: number;
  width: number;
  fx?: ShipFx;
  shippedToday: number;
}) {
  if (phase === 'ship' && fx) {
    const contentW = width - 4; // inside the frame: border (2) + paddingX (2)
    const t = easeOutCubic(clamp(fx.frame / FILL_FRAMES, 0, 1));
    // ramp the frame dark→bright with the fill, then settle exactly on the button green
    const frameColor = t >= 1 ? palette.good : greenRamp(t);
    const shown = Math.round(lerp(fx.fromProgress, 100, t));
    return (
      <Box
        width={width}
        flexDirection="column"
        borderStyle="round"
        borderColor={frameColor}
        paddingX={1}
      >
        <Shipping
          fx={fx}
          width={contentW}
          streak={shippedToday}
          shown={shown}
          reveal={fx.frame >= FILL_FRAMES}
        />
      </Box>
    );
  }

  // idle: no frame — it appears only during the ship celebration
  return <Idle item={item} progress={progress} width={width} />;
}
