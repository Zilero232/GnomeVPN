import type { ConfigWithStatus } from '../../../lib';

export type ConfigRowProps = {
  config: ConfigWithStatus;
  isBlocked?: boolean;
  isRevoking: boolean;
  onRevoke: () => void;
};
