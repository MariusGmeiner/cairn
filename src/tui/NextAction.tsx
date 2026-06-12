import React from 'react';
import { Box, Text } from 'ink';
import type { BacklogItem } from '../core/backlog.js';
import { palette, typeStyle, progressBar, progressColor, truncate } from './theme.js';

export const SHIP_FRAMES = 16;

export interface ShipFx {
  shipped?: { id: string; title: string; target?: string };
  next?: { id: string; title: string; target?: string };
  nextType?: BacklogItem['type'];
  queueEmpty: boolean;
  fromProgress: number;
  frame: number;
}

const SPARKLES = ['✦', '✶', '✷', '✺', '✦', '✸'];

function SparkleRow({ frame, width, count }: { frame: number; width: number; count: number }) {
  const cells = Math.max(6, Math.min(14, Math.floor(width / 4)));
  const head = frame % cells;
  const glyphs: React.ReactNode[] = [];
  for (let i = 0; i < cells; i++) {
    const bright = (i + head) % 3 === 0;
    const g = SPARKLES[(i + frame) % SPARKLES.length];
    glyphs.push(
      <Text key={i} color={bright ? palette.good : palette.dim}>
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

function DoneButton() {
  return (
    <Box marginTop={1}>
      <Box borderStyle="round" borderColor={palette.good} paddingX={1}>
        <Text color={palette.good} bold>
          ✓ done
        </Text>
        <Text color={palette.dim}>{'  · press '}</Text>
        <Text color={palette.good} bold>
          a
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
          <Text color={palette.accent}>/plan</Text>
          {' in the Claude Code pane to choose what is next'}
        </Text>
      </Box>
    );
  }
  const s = typeStyle[item.type];
  const titleW = Math.max(10, width - 6);
  return (
    <Box flexDirection="column">
      <HeaderRow
        right={
          <Text color={s.color} bold>
            {s.badge}
          </Text>
        }
      />
      <Box marginTop={1}>
        <Text color={palette.accent} bold>
          ▸{' '}
        </Text>
        <Text color={palette.heading} bold>
          {truncate(item.title, titleW)}
        </Text>
      </Box>
      {item.target && (
        <Box>
          <Text color={palette.dim}>{'   target '}</Text>
          <Text color={palette.accentDim}>▸ </Text>
          <Text color={palette.text}>{truncate(item.target, titleW - 4)}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text>{'   '}</Text>
        <Text color={progressColor(progress)}>{progressBar(progress, 16)}</Text>
        <Text color={palette.dim}>{`  ${progress}%`}</Text>
      </Box>
      <DoneButton />
    </Box>
  );
}

function Shipping({ fx, width, streak }: { fx: ShipFx; width: number; streak: number }) {
  const reveal = fx.frame >= 6;
  const fillT = Math.min(1, fx.frame / 6);
  const shown = Math.round(fx.fromProgress + (100 - fx.fromProgress) * fillT);
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
            <Text color={palette.warn}>queue empty — run /plan</Text>
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
    return <Shipping fx={fx} width={width} streak={shippedToday} />;
  }
  return <Idle item={item} progress={progress} width={width} />;
}
