import { invoke, isTauri } from '@tauri-apps/api/core';

import type { RustCommand, RustCommands } from './ipc.types';

type CallRustInput<C extends RustCommand> = RustCommands[C]['args'] extends never
  ? { command: C; fallback: RustCommands[C]['result'] }
  : { command: C; args: RustCommands[C]['args']; fallback: RustCommands[C]['result'] };

/**
 * The single door into the Rust side. Anything named callRust crosses the
 * process boundary into apps/tauri; everything else in shared/lib is plain
 * browser code.
 *
 * The bundle also runs in a browser and during prerender, where no Rust exists
 * — hence the mandatory fallback rather than a throw.
 */
export const callRust = async <C extends RustCommand>(
  input: CallRustInput<C>,
): Promise<RustCommands[C]['result']> => {
  if (!isTauri()) {
    return input.fallback;
  }

  return invoke<RustCommands[C]['result']>(
    input.command,
    'args' in input ? (input.args as Record<string, unknown>) : undefined,
  );
};
