import { Box, Text } from 'ink';
import { type BacklogItem, type ItemType } from '../core/backlog.js';
import { palette, typeStyle, statusColor, truncate } from './theme.js';

export type TypeFilter = ItemType | 'all';

/** Filter chips in keybinding order: index is the digit that selects it (0–4). */
const FILTER_ORDER: TypeFilter[] = ['all', 'core', 'feature', 'qol', 'bug'];

/** A scroll window centered on the selection, clamped to the list bounds. */
function windowAround(len: number, selected: number, rows: number): { start: number; end: number } {
  if (len <= rows) return { start: 0, end: len };
  let start = selected - Math.floor(rows / 2);
  start = Math.max(0, Math.min(start, len - rows));
  return { start, end: start + rows };
}

function MoreRow({ n, dir }: { n: number; dir: 'up' | 'down' }) {
  if (n <= 0) return null;
  return <Text color={palette.dim}>{`   ${dir === 'up' ? '↑' : '↓'} ${n} more`}</Text>;
}

/** The inbox: untriaged items, scrollable, one summary line each. */
export function InboxList({
  items,
  selected,
  rows,
  width,
}: {
  items: BacklogItem[];
  selected: number;
  rows: number;
  width: number;
}) {
  if (items.length === 0) {
    return (
      <Box>
        <Text color={palette.dim}>inbox is empty · run </Text>
        <Text color={palette.accent}>/capture</Text>
        <Text color={palette.dim}> in the Claude pane to add an idea</Text>
      </Box>
    );
  }
  const { start, end } = windowAround(items.length, selected, rows);
  const titleW = Math.max(10, width - 4);
  return (
    <Box flexDirection="column">
      <MoreRow n={start} dir="up" />
      {items.slice(start, end).map((it, i) => {
        const idx = start + i;
        const sel = idx === selected;
        return (
          <Box key={it.id}>
            <Text color={sel ? palette.accent : palette.dim}>{sel ? '▸ ' : '  '}</Text>
            <Text color={sel ? palette.heading : palette.text} bold={sel}>
              {truncate(it.summary ?? it.title, titleW)}
            </Text>
          </Box>
        );
      })}
      <MoreRow n={items.length - end} dir="down" />
    </Box>
  );
}

function FilterChips({ active }: { active: TypeFilter }) {
  return (
    <Box marginBottom={1}>
      <Text color={palette.dim}>{'filter  '}</Text>
      {FILTER_ORDER.map((f, i) => {
        const on = f === active;
        const label = f === 'all' ? 'all' : typeStyle[f].badge.toLowerCase();
        return (
          <Text key={f} color={on ? palette.accent : palette.dim} bold={on}>
            {`${i}:${label}  `}
          </Text>
        );
      })}
    </Box>
  );
}

/** The roadmap backlog (now/next/later/inbox), scrollable, filterable by type. */
export function BacklogList({
  items,
  selected,
  filter,
  rows,
  width,
}: {
  items: BacklogItem[];
  selected: number;
  filter: TypeFilter;
  rows: number;
  width: number;
}) {
  const listRows = Math.max(3, rows - 1); // one row spent on the filter chips
  const titleW = Math.max(10, width - 26);
  const { start, end } = windowAround(items.length, selected, listRows);
  return (
    <Box flexDirection="column">
      <FilterChips active={filter} />
      {items.length === 0 ? (
        <Text color={palette.dim}>
          {filter === 'all' ? 'backlog is empty · run /plan' : `no ${filter} items`}
        </Text>
      ) : (
        <Box flexDirection="column">
          <MoreRow n={start} dir="up" />
          {items.slice(start, end).map((it, i) => {
            const idx = start + i;
            const sel = idx === selected;
            const s = typeStyle[it.type];
            return (
              <Box key={it.id}>
                <Text color={sel ? palette.accent : palette.dim}>{sel ? '▸ ' : '  '}</Text>
                <Box width={10}>
                  <Text color={palette.accentDim}>{it.id}</Text>
                </Box>
                <Box width={5}>
                  <Text color={s.color} bold>
                    {s.badge}
                  </Text>
                </Box>
                <Box width={6}>
                  <Text color={statusColor[it.status] ?? palette.dim}>{it.status}</Text>
                </Box>
                <Text color={sel ? palette.heading : palette.text} bold={sel}>
                  {truncate(it.title, titleW)}
                </Text>
              </Box>
            );
          })}
          <MoreRow n={items.length - end} dir="down" />
        </Box>
      )}
    </Box>
  );
}
