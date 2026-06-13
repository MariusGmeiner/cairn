import { Box, Text } from 'ink';
import type { BacklogItem } from '../core/backlog.js';
import { palette, wrapText, clamp } from './theme.js';

/** Split an item body into display rows wrapped to `width`, trimming blank edges. */
function bodyRows(body: string, width: number): string[] {
  const rows = body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((line) => wrapText(line, width));
  while (rows.length > 0 && rows[0].trim() === '') rows.shift();
  while (rows.length > 0 && rows[rows.length - 1].trim() === '') rows.pop();
  return rows;
}

/**
 * Full reader for an item's body (frontmatter already stripped upstream). Pages
 * through `rows` lines at a time; the caller drives `scroll`.
 */
export function ContentViewer({
  item,
  scroll,
  rows,
  width,
}: {
  item?: BacklogItem;
  scroll: number;
  rows: number;
  width: number;
}) {
  if (!item) {
    return (
      <Box>
        <Text color={palette.dim}>nothing to view</Text>
      </Box>
    );
  }
  const lines = bodyRows(item.body, width);
  const maxScroll = Math.max(0, lines.length - rows);
  const top = clamp(scroll, 0, maxScroll);
  const above = top;
  const below = Math.max(0, lines.length - (top + rows));
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" width={width}>
        <Box>
          <Text color={palette.heading} bold>
            {item.id}
          </Text>
          <Text color={palette.dim}>{`  ${item.title}`}</Text>
        </Box>
        <Text color={palette.dim}>{above > 0 ? `↑ ${above}` : ''}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {lines.length === 0 ? (
          <Text color={palette.dim}>(no body — this item is frontmatter only)</Text>
        ) : (
          lines.slice(top, top + rows).map((ln, i) => (
            <Text key={top + i} color={palette.text}>
              {ln === '' ? ' ' : ln}
            </Text>
          ))
        )}
      </Box>
      <Box justifyContent="space-between" width={width} marginTop={1}>
        <Text color={palette.dim}>{below > 0 ? `↓ ${below} more` : '— end —'}</Text>
        <Text color={palette.dim}>↑/↓ scroll · esc close</Text>
      </Box>
    </Box>
  );
}
