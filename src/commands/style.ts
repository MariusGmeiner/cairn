/** Minimal ANSI styling for plain command output (no Ink/React here). */
const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const ESC = '\x1b';

function wrap(open: number, close: number) {
  return (s: string): string => (enabled ? `${ESC}[${open}m${s}${ESC}[${close}m` : s);
}

const fg = (code: number) => wrap(code, 39);

export const c = {
  reset: (s: string) => s,
  bold: wrap(1, 22),
  dim: fg(90),
  accent: fg(96),
  good: fg(92),
  warn: fg(93),
  bad: fg(91),
  heading: (s: string): string => (enabled ? `${ESC}[1m${ESC}[97m${s}${ESC}[0m` : s),
};
