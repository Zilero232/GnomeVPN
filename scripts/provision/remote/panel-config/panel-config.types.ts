import type { SshClient } from '@gnomevpn/scripts/ssh';

export type ConfigurePanelInput = {
  ssh: SshClient;
  password: string;
  panelPath: string;
};

export type WaitForPanelInput = {
  ssh: SshClient;
  panelPath: string;
};

export type KeepCoreRunningInput = {
  ssh: SshClient;
  panelPath: string;
  token: string;
};
