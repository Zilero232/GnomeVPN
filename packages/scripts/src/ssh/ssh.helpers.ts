import type { SshExecResult } from './ssh.types';

export const failureOf = ({ stdout, stderr, exitCode }: SshExecResult): string => {
  const output = stderr.trim() || stdout.trim() || 'no output';

  return `the remote command exited with ${exitCode}: ${output}`;
};
