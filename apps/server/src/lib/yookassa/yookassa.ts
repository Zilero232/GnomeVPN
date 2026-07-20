import type {
  ChargeRecurringInput,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentInfo,
  PaymentResponse,
  YooKassaClientOptions,
} from './yookassa.types';

const API_URL = 'https://api.yookassa.ru/v3';
const CURRENCY = 'RUB';

export class YooKassaClient {
  private readonly shopId: string;
  private readonly secretKey: string;

  constructor(opts: YooKassaClientOptions) {
    this.shopId = opts.shopId;
    this.secretKey = opts.secretKey;
  }

  private headers(idempotenceKey?: string): Record<string, string> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${this.shopId}:${this.secretKey}`)}`,
    };

    if (idempotenceKey) {
      base['Idempotence-Key'] = idempotenceKey;
    }

    return base;
  }

  private amount(rub: number) {
    return { value: rub.toFixed(2), currency: CURRENCY };
  }

  private async request(
    path: string,
    init: RequestInit,
    idempotenceKey?: string,
  ): Promise<PaymentResponse> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: this.headers(idempotenceKey),
    });

    if (!res.ok) {
      const detail = await res.text();

      throw new Error(`yookassa ${path} failed: ${res.status} ${detail}`);
    }

    return (await res.json()) as PaymentResponse;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const payload = await this.request(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: this.amount(input.amountRub),
          description: input.description,
          capture: true,
          save_payment_method: input.savePaymentMethod,
          confirmation: { type: 'redirect', return_url: input.returnUrl },
        }),
      },
      input.idempotenceKey,
    );

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: payload.confirmation?.confirmation_url ?? null,
    };
  }

  async chargeRecurring(input: ChargeRecurringInput): Promise<CreatePaymentResult> {
    const payload = await this.request(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: this.amount(input.amountRub),
          description: input.description,
          capture: true,
          payment_method_id: input.paymentMethodId,
        }),
      },
      input.idempotenceKey,
    );

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: null,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const payload = await this.request(`/payments/${paymentId}`, { method: 'GET' });

    return {
      id: payload.id,
      status: payload.status,
      paymentMethodId: payload.payment_method?.id ?? null,
    };
  }
}
