import { posix } from 'node:path';

import type { DockerExecInput, DockerShellInput, ShellArg } from './shell.types';

import { SHELL } from './shell.constants';

export const arg = (value: ShellArg) => {
  const text = String(value);

  if (SHELL.bareToken.test(text)) {
    return text;
  }

  return `'${text.replaceAll("'", SHELL.escapedQuote)}'`;
};

export const line = (parts: ShellArg[]) => parts.map(String).join(' ');

export const all = (commands: string[]) => commands.join(' && ');

export const orElse = (commands: string[]) => commands.join(' || ');

export const silent = (command: string) => `${command} >/dev/null 2>&1`;

export const quiet = (command: string) => `${command} 2>/dev/null`;

export const dockerExec = ({ container, argv }: DockerExecInput) => line(['docker', 'exec', container, ...argv]);

export const dockerShell = ({ container, script }: DockerShellInput) => line(['docker', 'exec', container, 'sh', '-lc', arg(script)]);

export const dirOf = (path: string) => posix.dirname(path);
