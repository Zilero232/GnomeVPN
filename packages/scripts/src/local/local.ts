import { $ } from 'bun';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Reporter } from '../reporter';
import type { ResolveCommandInput } from './local.types';

export const workspace = fileURLToPath(new URL('../../../..', import.meta.url));

export const isWindows = process.platform === 'win32';

$.cwd(workspace);
$.throws(true);

const has = async (command: string): Promise<boolean> => {
  const result = await $`${isWindows ? 'where' : 'which'} ${command}`.nothrow().quiet();

  return result.exitCode === 0;
};

const resolveCommand = async ({ command, knownPaths }: ResolveCommandInput): Promise<string | null> => {
  if (await has(command)) {
    return command;
  }

  return knownPaths.find((path) => existsSync(path)) ?? null;
};

export const findGh = (): Promise<string | null> =>
  resolveCommand({
    command: 'gh',
    knownPaths: [
      join(process.env.ProgramFiles ?? 'C:\\Program Files', 'GitHub CLI', 'gh.exe'),
      join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Links', 'gh.exe')
    ]
  });

export const requireGh = async (log: Reporter): Promise<string> => {
  const gh = await findGh();

  if (!gh) {
    log.fail('gh not found — run `bun run setup:release`, then `gh auth login`');
  }

  return gh;
};

export { $ };
