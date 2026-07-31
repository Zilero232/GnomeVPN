import { callRust } from '../ipc';

export const saveTokenToVault = async (token: string): Promise<void> => {
  await callRust({ command: 'vault_save_token', args: { token }, fallback: null });
};

export const readTokenFromVault = async (): Promise<string | null> => callRust({ command: 'vault_read_token', fallback: null });

export const clearTokenFromVault = async (): Promise<void> => {
  await callRust({ command: 'vault_clear_token', fallback: null });
};
