import { Box, Text } from 'ink';
import { palette } from './theme.js';

export function Rule({ width, color = palette.rule }: { width: number; color?: string }) {
  return <Text color={color}>{'─'.repeat(Math.max(1, width))}</Text>;
}

/** Two-line header: the brand + slogan on top, repo + live clock below. */
export function Header({ repo, clock, width }: { repo: string; clock: string; width: number }) {
  const logo = ' ▟█▙ CAIRN';
  const slogan = ' · marks your next step';
  // Line 2: repo on the left, the live clock on the right, pushed apart.
  const repoTag = ` ${repo}`;
  const gap = Math.max(1, width - repoTag.length - clock.length);
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={palette.accent} bold>
          {logo}
        </Text>
        <Text color={palette.dim}>{slogan}</Text>
      </Box>
      <Box>
        <Text color={palette.text}>{repoTag}</Text>
        <Text>{' '.repeat(gap)}</Text>
        <Text color={palette.dim}>{clock}</Text>
      </Box>
    </Box>
  );
}

export function Footer({
  width,
  message,
  commitMode,
  ballotDue,
  keys,
}: {
  width: number;
  message?: string;
  commitMode?: string;
  ballotDue?: boolean;
  keys?: string;
}) {
  const left = '  watching ./.cairn ';
  const live = '● live';
  const mode = commitMode ? `  · ${commitMode}` : '';
  const keyHint = `${keys ?? '[a]dvance · [q]uit'}  `;
  const center = message ?? (ballotDue ? 'ballot due · /cairn-ballot' : '');
  const used = left.length + live.length + mode.length + center.length + keyHint.length;
  const gap = Math.max(2, width - used);
  const lead = Math.floor(gap / 2);
  const tail = gap - lead;
  const centerColor = message ? palette.warn : ballotDue ? palette.warn : palette.dim;
  return (
    <Box>
      <Text color={palette.dim}>{left}</Text>
      <Text color={palette.live}>{live}</Text>
      <Text color={palette.dim}>{mode}</Text>
      <Text>{' '.repeat(lead)}</Text>
      <Text color={centerColor}>{center}</Text>
      <Text>{' '.repeat(tail)}</Text>
      <Text color={palette.dim}>{keyHint}</Text>
    </Box>
  );
}
