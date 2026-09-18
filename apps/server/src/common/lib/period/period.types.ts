export type PeriodInput = {
  currentPeriodEnd: Date | null | undefined;
  months: number;
};

export type SubscriptionPeriod = {
  currentPeriodEnd: Date | null;
  extraDevices: number;
};
