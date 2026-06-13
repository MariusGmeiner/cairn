import { Box, Text } from 'ink';
import type { SkillInfo } from '../core/skills.js';
import { palette, truncate } from './theme.js';

interface HelpLine {
  key: string;
  text: string;
}

/** The CAIRN working loop, one line each. */
const FLOW: HelpLine[] = [
  { key: '/capture', text: 'jot an idea — it asks a couple questions, then files it in the inbox' },
  { key: '/plan', text: 'rank the backlog into now / next / later and pre-compute the queue' },
  { key: 'work', text: 'do the next action in your editor; commit as usual' },
  { key: '/sync', text: 'pull progress from your commits and advance when the target is met' },
  { key: '/shutdown', text: 'close the day — daily log + the biweekly QoL vote' },
  { key: '/ballot', text: 'every second Monday, vote on the next small feature to build' },
];

const TABKEYS: HelpLine[] = [
  { key: '←/→', text: 'switch tabs' },
  { key: 'a', text: 'mark the current action shipped' },
  { key: 'v', text: 'open the selected item in a scrollable reader' },
  { key: '↑/↓', text: 'move the selection in Inbox / Backlog · scroll in the reader' },
  { key: '0–4', text: 'filter the Backlog by type (all / core / feat / qol / bug)' },
  { key: 'q', text: 'quit' },
];

function Line({ k, text, width }: { k: string; text: string; width: number }) {
  return (
    <Box>
      <Box width={11}>
        <Text color={palette.accent} bold>
          {k}
        </Text>
      </Box>
      <Text color={palette.text}>{truncate(text, Math.max(20, width - 13))}</Text>
    </Box>
  );
}

/** The Help tab: how the workflow fits together, the keys, and the Claude skills. */
export function HelpView({ skills, width }: { skills: SkillInfo[]; width: number }) {
  const anyInstalled = skills.some((s) => s.installed);
  return (
    <Box flexDirection="column">
      <Text color={palette.heading} bold>
        The loop
      </Text>
      {FLOW.map((l) => (
        <Line key={l.key} k={l.key} text={l.text} width={width} />
      ))}

      <Box marginTop={1}>
        <Text color={palette.heading} bold>
          Keys
        </Text>
      </Box>
      {TABKEYS.map((l) => (
        <Line key={l.key} k={l.key} text={l.text} width={width} />
      ))}

      <Box marginTop={1}>
        <Text color={palette.heading} bold>
          Claude skills
        </Text>
        <Text color={palette.dim}>{'  · run in the Claude Code pane'}</Text>
      </Box>
      {skills.length === 0 && (
        <Text color={palette.dim}>no skills found · run `cairn install-skills`</Text>
      )}
      {skills.map((s) => (
        <Box key={s.name}>
          <Box width={11}>
            <Text color={s.installed ? palette.accent : palette.dim} bold>{`/${s.name}`}</Text>
          </Box>
          <Text color={s.installed ? palette.text : palette.dim}>
            {truncate(s.description, Math.max(20, width - 13))}
          </Text>
        </Box>
      ))}
      {!anyInstalled && skills.length > 0 && (
        <Text color={palette.dim}>(showing bundled copies — `cairn install-skills` to enable)</Text>
      )}
    </Box>
  );
}
