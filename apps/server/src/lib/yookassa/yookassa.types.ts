export type YooKassaClientOptions = {
  shopId: string;
  secretKey: string;
};

export type PaymentResponse = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
  payment_method?: { id?: string };
};

export type CreatePaymentInput = {
  amountRub: number;
  description: string;
  returnUrl: string;
  idempotenceKey: string;
  savePaymentMethod: boolean;
};

export type ChargeRecurringInput = {
  amountRub: number;
  description: string;
  paymentMethodId: string;
  idempotenceKey: string;
};

export type CreatePaymentResult = {
  id: string;
  status: string;
  confirmationUrl: string | null;
};

export type PaymentInfo = {
  id: string;
  status: string;
  paymentMethodId: string | null;
};
