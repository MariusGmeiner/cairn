import fs from 'node:fs';
import path from 'node:path';
import { bundledSkillsDir, userSkillsDir } from '../core/paths.js';
import { c } from './style.js';

export interface InstallSkillsOptions {
  force?: boolean;
}

/** Install the four bundled skills into ~/.claude/skills (idempotent unless --force). */
export function runInstallSkills(opts: InstallSkillsOptions = {}): void {
  const src = bundledSkillsDir();
  const dst = userSkillsDir();

  if (!fs.existsSync(src)) {
    console.error(c.bad(`Bundled skills not found at ${src}`));
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(dst, { recursive: true });
  const skills = fs
    .readdirSync(src, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(src, e.name, 'SKILL.md')));

  if (skills.length === 0) {
    console.error(c.bad('No bundled skills to install.'));
    process.exitCode = 1;
    return;
  }

  console.log(c.heading('\n  Installing CAIRN skills → ') + c.dim(dst) + '\n');
  let installed = 0;
  let skipped = 0;
  for (const skill of skills) {
    const target = path.join(dst, skill.name);
    const exists = fs.existsSync(path.join(target, 'SKILL.md'));
    if (exists && !opts.force) {
      console.log(
        `  ${c.dim('•')} ${c.accent('/' + skill.name)} ${c.dim('already installed (use --force to overwrite)')}`,
      );
      skipped++;
      continue;
    }
    fs.cpSync(path.join(src, skill.name), target, { recursive: true });
    console.log(
      `  ${c.good('✓')} ${c.accent('/' + skill.name)} ${c.dim(exists ? 'updated' : 'installed')}`,
    );
    installed++;
  }

  console.log(
    '\n  ' +
      c.good(`${installed} installed`) +
      (skipped ? c.dim(` · ${skipped} skipped`) : '') +
      '\n',
  );
}
