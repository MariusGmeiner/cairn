import { Box, Text } from 'ink';
import { palette, truncate } from './theme.js';

/** The braille brand mark: a small pile + the CAIRN wordmark (one space per letter). */
const LOGO_PILE = '⣠⣾⣷⣄';
const LOGO_WORD = '⣏⡁ ⡮⡆ ⣹⡁ ⡯⡂ ⣗⣼';

/**
 * Render text "lit from the right": the left body in shadow, the right edge bright, so
 * the strokes read as catching light from one side. Shared by the logo and the rules.
 */
function LitText({ text, bold }: { text: string; bold?: boolean }) {
  const cut = Math.ceil(text.length * 0.75) - 1; // lit edge is the rightmost 25% of the text
  return (
    <Text bold={bold}>
      <Text color={palette.shadow}>{text.slice(0, cut)}</Text>
      <Text color={palette.lit}>{text.slice(cut)}</Text>
    </Text>
  );
}

/** Light a spaced word per letter: split on spaces and lit-shade each letter on its own. */
function LitWord({ text, bold }: { text: string; bold?: boolean }) {
  return (
    <Text>
      {text.split(' ').map((letter, i) => (
        <Text key={i}>
          {i > 0 ? ' ' : ''}
          <LitText text={letter} bold={bold} />
        </Text>
      ))}
    </Text>
  );
}

export function Rule({ width }: { width: number }) {
  const w = Math.max(1, width);
  const cut = Math.ceil(w * 0.75) - 1; // lit edge is the rightmost 25% of the width
  return (
    <Text>
      <Text color={palette.shadow}>{'─'.repeat(cut)}</Text>
      <Text color={palette.lit}>{'─'.repeat(w - cut)}</Text>
    </Text>
  );
}

/** Two-line header: braille logo + slogan on top, "Project: <repo>" + live clock below. */
export function Header({ repo, clock }: { repo: string; clock: string }) {
  const slogan = ' · marks your next step';
  return (
    <Box flexDirection="column">
      <Box>
        <Text>{' '}</Text>
        <LitText text={LOGO_PILE} bold />
        <Text>{' '}</Text>
        <LitWord text={LOGO_WORD} bold />
        <LitWord text={slogan} />
      </Box>
      <Box justifyContent="space-between">
        <Box>
          <Text color={palette.dim}>{' Project: '}</Text>
          <Text color={palette.heading}>{repo}</Text>
        </Box>
        <Text color={palette.dim}>{clock}</Text>
      </Box>
    </Box>
  );
}

/**
 * Lay the footer out so its parts always total exactly `width`.
 *
 * The status line sits outside the bordered frame, in a Box of fixed height. If its
 * content is one column too wide, Ink wraps it onto a second line, the frame grows
 * past the terminal height, and flexbox squeezes that line back out of whatever sits
 * above — dropping header lines and slicing characters off the body. So the parts are
 * truncated to fit here rather than trusted to be short: transient text (the centre
 * message, then the key hint) yields first, and the result is padded, never overflowed.
 */
export function footerLayout(
  width: number,
  { message, commitMode, ballotDue, keys }: { message?: string; commitMode?: string; ballotDue?: boolean; keys?: string },
): { left: string; live: string; mode: string; lead: number; center: string; tail: number; keyHint: string } {
  const MIN_GAP = 2;
  const left = '  watching ./.cairn ';
  const live = '● live';
  const mode = commitMode ? `  · ${commitMode}` : '';
  const fixed = left.length + live.length + mode.length;

  // The key hint shrinks before the frame does; the centre message shrinks before that.
  const keyHint = truncate(`${keys ?? '[a]dvance · [q]uit'}  `, Math.max(0, width - fixed - MIN_GAP));
  const room = width - fixed - keyHint.length - MIN_GAP;
  const center = room > 0 ? truncate(message ?? (ballotDue ? 'ballot due · /cairn-ballot' : ''), room) : '';

  const gap = Math.max(MIN_GAP, width - (fixed + center.length + keyHint.length));
  const lead = Math.floor(gap / 2);
  return { left, live, mode, lead, center, tail: gap - lead, keyHint };
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
  const { left, live, mode, lead, center, tail, keyHint } = footerLayout(width, {
    message,
    commitMode,
    ballotDue,
    keys,
  });
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
