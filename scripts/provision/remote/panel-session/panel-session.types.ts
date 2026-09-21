import type { SshClient } from '@gnomevpn/scripts/ssh';

export type PanelSession = {
  baseUrl: string;
  token: string;
};

export type StartPanelInput = {
  ssh: SshClient;
  host: string;
  password: string;
  panelPath: string;
};

export type PanelUrlInput = {
  host: string;
  panelPath: string;
};

export type WaitForPanelInput = {
  baseUrl: string;
  token: string;
};
