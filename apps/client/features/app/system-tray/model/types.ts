export type TrayMenuLabels = {
  toggle: string;
  account: string;
  quit: string;
};

export type TrayMenuActions = {
  onToggle: () => Promise<void>;
  onOpenAccount: () => Promise<void>;
  onBeforeQuit: () => Promise<void>;
};

export type TraySetupInput = TrayMenuActions & {
  isConnected: boolean;
  country: string;
};
