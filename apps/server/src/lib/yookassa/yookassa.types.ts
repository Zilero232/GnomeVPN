export type YooKassaClientOptions = {
  shopId: string;
  secretKey: string;
};

export type CardData = {
  last4?: string;
  card_type?: string;
};

export type PaymentResponse = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
  payment_method?: {
    id?: string;
    title?: string;
    card?: CardData;
  };
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
  paymentMethodTitle: string | null;
};

export type BindPaymentMethodInput = {
  returnUrl: string;
  idempotenceKey: string;
};

export type PaymentMethodStatus = 'active' | 'inactive' | 'pending';

export type PaymentMethodInfo = {
  id: string;
  status: PaymentMethodStatus;
  title: string | null;
  confirmationUrl: string | null;
};

export type PaymentMethodResponse = {
  id: string;
  status: PaymentMethodStatus;
  title?: string;
  card?: CardData;
  confirmation?: { confirmation_url?: string };
};
