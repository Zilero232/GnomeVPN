export type RenewalIdempotenceKeyInput = {
  userId: string;
  currentPeriodEnd: Date;
  paymentMethodId: string;
  amountRub: number;
};
