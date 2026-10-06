export type SlotDevice = {
  id: string;
  createdAt: Date;
};

export type SlotHoldersInput = {
  devices: SlotDevice[];
  limit: number;
};
