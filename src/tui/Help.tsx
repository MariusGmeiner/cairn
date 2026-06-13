import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { SkillInfo } from '../core/skills.js';
import { palette, truncate, clamp } from './theme.js';

interface HelpLine {
  key: string;
  text: string;
}

/** The CAIRN working loop, one line each. */
const FLOW: HelpLine[] = [
  { key: '/cairn-capture', text: 'jot an idea — it asks a couple questions, then files it in the inbox' },
  { key: '/cairn-plan', text: 'rank the backlog into now / next / later and pre-compute the queue' },
  { key: 'work', text: 'do the next action in your editor; commit as usual' },
  { key: '/cairn-sync', text: 'pull progress from your commits and advance when the target is met' },
  { key: '/cairn-shutdown', text: 'close the day — daily log + the biweekly QoL vote' },
  { key: '/cairn-ballot', text: 'every second Monday, vote on the next small feature to build' },
];

const TABKEYS: HelpLine[] = [
  { key: '←/→', text: 'switch tabs' },
  { key: 'a', text: 'mark the current action shipped' },
  { key: 'enter', text: 'open / close the selected item in the reader' },
  { key: '↑/↓', text: 'move the selection / scroll the list, reader, and this view' },
  { key: '1–5', text: 'filter the Backlog by type (all / core / feat / qol / bug)' },
  { key: 'q', text: 'quit' },
];

function Line({ k, text, width }: { k: string; text: string; width: number }) {
  return (
    <Box>
      <Box width={16}>
        <Text color={palette.accent} bold>
          {k}
        </Text>
      </Box>
      <Text color={palette.text}>{truncate(text, Math.max(20, width - 18))}</Text>
    </Box>
  );
}

function SkillRow({ s, width }: { s: SkillInfo; width: number }) {
  return (
    <Box>
      <Box width={16}>
        <Text color={s.installed ? palette.accent : palette.dim} bold>{`/${s.name}`}</Text>
      </Box>
      <Text color={s.installed ? palette.text : palette.dim}>
        {truncate(s.description, Math.max(20, width - 18))}
      </Text>
    </Box>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <Text color={palette.heading} bold>
      {children}
    </Text>
  );
}

/** The Help tab flattened to one row per line, so it can be windowed and scrolled. */
export function buildHelpRows(skills: SkillInfo[], width: number): ReactNode[] {
  const rows: ReactNode[] = [];
  rows.push(<Heading key="h-loop">The loop</Heading>);
  FLOW.forEach((l, i) => rows.push(<Line key={`f${i}`} k={l.key} text={l.text} width={width} />));
  rows.push(<Text key="b1"> </Text>);
  rows.push(<Heading key="h-keys">Keys</Heading>);
  TABKEYS.forEach((l, i) => rows.push(<Line key={`t${i}`} k={l.key} text={l.text} width={width} />));
  rows.push(<Text key="b2"> </Text>);
  rows.push(
    <Text key="h-skills">
      <Text color={palette.heading} bold>
        Claude skills
      </Text>
      <Text color={palette.dim}>{'  · run in the Claude Code pane'}</Text>
    </Text>,
  );
  if (skills.length === 0) {
    rows.push(
      <Text key="noskills" color={palette.dim}>
        no skills found · run `cairn install-skills`
      </Text>,
    );
  }
  skills.forEach((s) => rows.push(<SkillRow key={s.name} s={s} width={width} />));
  if (skills.length > 0 && !skills.some((s) => s.installed)) {
    rows.push(
      <Text key="bundled" color={palette.dim}>
        (showing bundled copies — `cairn install-skills` to enable)
      </Text>,
    );
  }
  return rows;
}

/** The Help tab: workflow, keys, and skills — windowed so it never spills past the box. */
export function HelpView({
  skills,
  width,
  rows,
  scroll,
}: {
  skills: SkillInfo[];
  width: number;
  rows: number;
  scroll: number;
}) {
  const all = buildHelpRows(skills, width);
  const total = all.length;
  if (total <= rows) {
    return <Box flexDirection="column">{all}</Box>;
  }
  const visible = Math.max(1, rows - 2);
  const top = clamp(scroll, 0, total - visible);
  const above = top;
  const below = total - (top + visible);
  return (
    <Box flexDirection="column">
      <Text color={palette.dim}>{above > 0 ? `  ↑ ${above} more` : ''}</Text>
      {all.slice(top, top + visible)}
      <Text color={palette.dim}>{below > 0 ? `  ↓ ${below} more` : ''}</Text>
    </Box>
  );
}
