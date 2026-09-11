export { autoConnectTarget } from './lib';
export { useVpnConnectionContext, VpnConnectionProvider } from './model/context';
export { useProtocolSelection } from './model/hooks';
export type { VpnConnectionStatus, VpnTraffic } from './model/hooks';
export { useConnectToggle } from './model/hooks/use-connect-toggle';
export type { ConnectTarget } from './model/hooks/use-connect-toggle';

export { ConnectButton } from './ui/ConnectButton';
export type { ConnectButtonProps } from './ui/ConnectButton.types';
