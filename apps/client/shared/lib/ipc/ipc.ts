import { invoke, isTauri } from '@tauri-apps/api/core';

import { logger } from '../logger';

import type { RustCommand, RustCommands } from './ipc.types';

type CallRustInput<C extends RustCommand> = RustCommands[C]['args'] extends never
  ? { command: C; fallback: RustCommands[C]['result'] }
  : { command: C; args: RustCommands[C]['args']; fallback: RustCommands[C]['result'] };

const isMissingCommand = (error: unknown): boolean =>
  /command .*not found|\bnot allowed\b/i.test(String(error));

export const callRust = async <C extends RustCommand>(
  input: CallRustInput<C>,
): Promise<RustCommands[C]['result']> => {
  if (!isTauri()) {
    return input.fallback;
  }

  try {
    return await invoke<RustCommands[C]['result']>(
      input.command,
      'args' in input ? (input.args as Record<string, unknown>) : undefined,
    );
  } catch (error) {
    if (isMissingCommand(error)) {
      logger.warn(`${input.command} is not available on this platform`);

      return input.fallback;
    }

    throw error;
  }
};
