import type { SshClient } from '@gnomevpn/scripts/ssh';

import type { PanelSession } from '../../remote';

export type InstallInboundsInput = {
  ssh: SshClient;
  panel: PanelSession;
  auth: string;
};

export type InstalledInbounds = {
  certFingerprint: string;
  realityPublicKey: string;
  realityShortId: string;
  realityWasGenerated: boolean;
};
