import { callRust } from '../ipc';

export const repairVpnService = async (): Promise<void> => {
  await callRust({ command: 'service_repair', fallback: null });
};
