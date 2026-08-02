import type { SshClient } from '@gnomevpn/scripts/ssh';

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

export type EnsuredWireguardKeys = {
  privateKey: string;
  publicKey: string;
  wasGenerated: boolean;
};
