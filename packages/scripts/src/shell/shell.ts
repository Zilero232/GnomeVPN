import { quote } from 'shell-quote';

import type { DockerExecInput, DockerShellInput, ShellArg } from './shell.types';

export const arg = (value: ShellArg) => quote([String(value)]);

export const line = (parts: ShellArg[]) => parts.map(String).join(' ');

export const all = (commands: string[]) => commands.join(' && ');

export const orElse = (commands: string[]) => commands.join(' || ');

export const silent = (command: string) => `${command} >/dev/null 2>&1`;

export const quiet = (command: string) => `${command} 2>/dev/null`;

export const dockerExec = ({ container, argv }: DockerExecInput) => line(['docker', 'exec', container, ...argv]);

export const dockerShell = ({ container, script }: DockerShellInput) => line(['docker', 'exec', container, 'sh', '-lc', arg(script)]);

export const dirOf = (path: string) => path.slice(0, path.lastIndexOf('/'));
