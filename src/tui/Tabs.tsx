import { Box, Text } from 'ink';
import { palette } from './theme.js';

/** The ordered tab labels. Index is the canonical tab id used across the app. */
export const TABS = ['Next', 'Inbox', 'Backlog', 'Help'] as const;

/**
 * The top tab strip. The active tab is marked and bright; the Inbox tab carries a
 * live count badge so the number of untriaged items is visible from any tab.
 */
export function TabBar({
  active,
  inboxCount,
  width,
}: {
  active: number;
  inboxCount: number;
  width: number;
}) {
  return (
    <Box width={width}>
      {TABS.map((label, i) => {
        const isActive = i === active;
        const showBadge = i === 1 && inboxCount > 0;
        return (
          <Box key={label} marginRight={3}>
            <Text color={isActive ? palette.accent : palette.dim} bold={isActive}>
              {`${isActive ? '▸ ' : '  '}${label}`}
            </Text>
            {showBadge && (
              <Text color={palette.warn} bold>
                {` ${inboxCount}`}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
