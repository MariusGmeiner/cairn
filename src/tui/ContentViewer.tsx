import { Box, Text } from 'ink';
import type { BacklogItem } from '../core/backlog.js';
import { palette, clamp, link } from './theme.js';
import { renderBody, type Row } from './markdown.js';

/** Draw one row of styled markdown segments as a single Ink line. */
function MarkdownRow({ row }: { row: Row }) {
  if (row.every((seg) => seg.text === '')) return <Text> </Text>;
  // `truncate-end`, not the default wrap: the pager counts one logical row per line,
  // so a row Ink decides to re-wrap would push the rest of the body out of view.
  return (
    <Text wrap="truncate-end">
      {row.map((seg, i) => (
        <Text
          key={i}
          color={seg.color ?? palette.text}
          bold={seg.bold}
          italic={seg.italic}
          dimColor={seg.dim}
          strikethrough={seg.strikethrough}
        >
          {seg.href ? link(seg.text, seg.href) : seg.text}
        </Text>
      ))}
    </Text>
  );
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
  const lines = renderBody(item.body, width);
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
          lines.slice(top, top + rows).map((row, i) => <MarkdownRow key={top + i} row={row} />)
        )}
      </Box>
      <Box justifyContent="space-between" width={width} marginTop={1}>
        <Text color={palette.dim}>{below > 0 ? `↓ ${below} more` : '— end —'}</Text>
        <Text color={palette.dim}>↑/↓ scroll · esc close</Text>
      </Box>
    </Box>
  );
}
