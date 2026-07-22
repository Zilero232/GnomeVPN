import type { SshClient } from '../ssh-client';

export type ShipStackInput = {
  ssh: SshClient;
  composeContent: string;
};

export type ConfigurePanelInput = {
  ssh: SshClient;
  password: string;
  panelPath: string;
};

export type WaitForPanelInput = {
  ssh: SshClient;
  panelPath: string;
};
