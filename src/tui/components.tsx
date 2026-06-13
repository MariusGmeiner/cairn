import React from 'react';
import { Box, Text } from 'ink';
import type { BacklogItem } from '../core/backlog.js';
import type { SkillInfo } from '../core/skills.js';
import { palette, truncate } from './theme.js';

export function Rule({ width, color = palette.rule }: { width: number; color?: string }) {
  return <Text color={color}>{'─'.repeat(Math.max(1, width))}</Text>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text color={palette.dim} bold>
      {children}
    </Text>
  );
}

export function Header({
  repo,
  clock,
  width,
}: {
  repo: string;
  clock: string;
  width: number;
}) {
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

function Column({
  label,
  items,
  width,
  bullet = '•',
  bulletColor = palette.dim,
  emphasize = false,
}: {
  label: string;
  items: { id: string; title: string }[];
  width: number;
  bullet?: string;
  bulletColor?: string;
  emphasize?: boolean;
}) {
  const max = 4;
  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;
  const titleW = Math.max(6, width - 3);
  return (
    <Box flexDirection="column" width={width}>
      <SectionLabel>{label}</SectionLabel>
      {shown.length === 0 && <Text color={palette.dim}>—</Text>}
      {shown.map((it) => (
        <Box key={it.id}>
          <Text color={bulletColor}>{bullet} </Text>
          <Text color={emphasize ? palette.heading : palette.text} bold={emphasize}>
            {truncate(it.title, titleW)}
          </Text>
        </Box>
      ))}
      {overflow > 0 && <Text color={palette.dim}>{`  +${overflow} more`}</Text>}
    </Box>
  );
}

export function Roadmap({
  now,
  next,
  later,
  width,
}: {
  now: { id: string; title: string }[];
  next: { id: string; title: string }[];
  later: { id: string; title: string }[];
  width: number;
}) {
  const col = Math.floor((width - 2) / 3);
  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Column label="NOW" items={now} width={col} bullet="▸" bulletColor={palette.accent} emphasize />
      <Column label="NEXT" items={next} width={col} bullet="•" bulletColor={palette.accentDim} />
      <Column label="LATER" items={later} width={col} bullet="·" bulletColor={palette.dim} />
    </Box>
  );
}

export function Inbox({ items, width }: { items: BacklogItem[]; width: number }) {
  const max = 3;
  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" width={width}>
        <SectionLabel>INBOX</SectionLabel>
        <Text color={items.length > 0 ? palette.warn : palette.dim}>
          {items.length > 0 ? `${items.length} new` : 'empty'}
        </Text>
      </Box>
      {shown.length === 0 ? (
        <Text color={palette.dim}>nothing waiting to triage · /capture to add</Text>
      ) : (
        <Box flexDirection="row" flexWrap="wrap">
          {shown.map((it, i) => (
            <Text key={it.id} color={palette.text}>
              <Text color={palette.warn}>{'• '}</Text>
              {truncate(it.summary ?? it.title, 28)}
              {i < shown.length - 1 ? '   ' : ''}
            </Text>
          ))}
          {overflow > 0 && <Text color={palette.dim}>{`   +${overflow}`}</Text>}
        </Box>
      )}
    </Box>
  );
}

export function SkillsLegend({ skills, width }: { skills: SkillInfo[]; width: number }) {
  const anyInstalled = skills.some((s) => s.installed);
  const descW = Math.max(20, width - 14);
  return (
    <Box flexDirection="column">
      <Box>
        <SectionLabel>SKILLS</SectionLabel>
        <Text color={palette.dim}>{'  ·  run these in the Claude Code pane →'}</Text>
      </Box>
      {skills.length === 0 && (
        <Text color={palette.dim}>no skills found · run `cairn install-skills`</Text>
      )}
      {skills.map((s) => (
        <Box key={s.name}>
          <Box width={11}>
            <Text color={palette.accent} bold>{`/${s.name}`}</Text>
          </Box>
          <Text color={s.installed ? palette.text : palette.dim}>
            {truncate(s.description, descW)}
          </Text>
        </Box>
      ))}
      {!anyInstalled && skills.length > 0 && (
        <Text color={palette.dim}>(showing bundled copies — `cairn install-skills` to enable)</Text>
      )}
    </Box>
  );
}

export function Footer({
  width,
  message,
  commitMode,
  ballotDue,
}: {
  width: number;
  message?: string;
  commitMode?: string;
  ballotDue?: boolean;
}) {
  const left = '  watching ./.cairn ';
  const live = '● live';
  const mode = commitMode ? `  · ${commitMode}` : '';
  const keys = '[a]dvance   [q]uit  ';
  const center = message ?? (ballotDue ? 'ballot due · /ballot' : '');
  const used = left.length + live.length + mode.length + center.length + keys.length;
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
      <Text color={palette.dim}>{keys}</Text>
    </Box>
  );
}
