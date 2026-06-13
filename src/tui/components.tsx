import { Box, Text } from 'ink';
import { palette } from './theme.js';

/** The braille brand mark: a small pile + the CAIRN wordmark. */
const LOGO_PILE = '⣠⣾⣷⣄';
const LOGO_WORD = '⣏⡁⡮⡆⣹⡁⡯⡂⡗⡅';

/**
 * Render text "lit from the right": the left body in shadow, the right edge bright, so
 * the strokes read as catching light from one side. Shared by the logo and the rules.
 */
function LitText({ text, bold }: { text: string; bold?: boolean }) {
  const cut = Math.ceil(text.length / 2);
  return (
    <Text bold={bold}>
      <Text color={palette.shadow}>{text.slice(0, cut)}</Text>
      <Text color={palette.lit}>{text.slice(cut)}</Text>
    </Text>
  );
}

export function Rule({ width }: { width: number }) {
  const w = Math.max(1, width);
  const cut = Math.ceil(w / 2);
  return (
    <Text>
      <Text color={palette.shadow}>{'─'.repeat(cut)}</Text>
      <Text color={palette.lit}>{'─'.repeat(w - cut)}</Text>
    </Text>
  );
}

/** Two-line header: braille logo + slogan on top, "Project: <repo>" + live clock below. */
export function Header({ repo, clock, width }: { repo: string; clock: string; width: number }) {
  const slogan = ' · marks your next step';
  const label = ' Project: ';
  const gap = Math.max(1, width - label.length - repo.length - clock.length);
  return (
    <Box flexDirection="column">
      <Box>
        <Text>{' '}</Text>
        <LitText text={LOGO_PILE} bold />
        <Text>{' '}</Text>
        <LitText text={LOGO_WORD} bold />
        <Text color={palette.dim}>{slogan}</Text>
      </Box>
      <Box>
        <Text color={palette.dim}>{label}</Text>
        <Text color={palette.heading}>{repo}</Text>
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
