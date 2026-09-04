import { Logger } from '@nestjs/common';

import type {
  BindPaymentMethodInput,
  ChargeRecurringInput,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentInfo,
  PaymentMethodInfo,
  PaymentMethodResponse,
  PaymentResponse,
  YooKassaClientOptions,
  YooKassaRequestInput
} from './yookassa.types';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { describeCard } from './lib';
import { API_URL, CURRENCY, REQUEST_TIMEOUT_MS } from './yookassa.constants';

export class YooKassaClient {
  private readonly logger = new Logger(YooKassaClient.name);
  private readonly shopId: string;
  private readonly secretKey: string;

  constructor(opts: YooKassaClientOptions) {
    this.shopId = opts.shopId;
    this.secretKey = opts.secretKey;
  }

  private headers(idempotenceKey?: string): Record<string, string> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${this.shopId}:${this.secretKey}`)}`
    };

    if (idempotenceKey) {
      base['Idempotence-Key'] = idempotenceKey;
    }

    return base;
  }

  private amount(rub: number) {
    return { value: rub.toFixed(2), currency: CURRENCY };
  }

  private async request<T>({ path, init, idempotenceKey }: YooKassaRequestInput): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: this.headers(idempotenceKey),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!res.ok) {
      this.logger.error(`yookassa ${path} returned ${res.status}: ${await res.text()}`);

      throw new AppServiceUnavailableException('PAYMENT_FAILED', `yookassa ${path} returned ${res.status}`);
    }

    return (await res.json()) as T;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const payload = await this.request<PaymentResponse>({
      path: '/payments',
      init: {
        method: 'POST',
        body: JSON.stringify({
          capture: true,
          amount: this.amount(input.amountRub),
          description: input.description,
          save_payment_method: input.savePaymentMethod,
          confirmation: { type: 'redirect', return_url: input.returnUrl }
        })
      },
      idempotenceKey: input.idempotenceKey
    });

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: payload.confirmation?.confirmation_url ?? null
    };
  }

  async chargeRecurring(input: ChargeRecurringInput): Promise<CreatePaymentResult> {
    const payload = await this.request<PaymentResponse>({
      path: '/payments',
      init: {
        method: 'POST',
        body: JSON.stringify({
          amount: this.amount(input.amountRub),
          description: input.description,
          capture: true,
          payment_method_id: input.paymentMethodId
        })
      },
      idempotenceKey: input.idempotenceKey
    });

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: null
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const payload = await this.request<PaymentResponse>({ path: `/payments/${paymentId}`, init: { method: 'GET' } });

    return {
      id: payload.id,
      status: payload.status,
      paymentMethodId: payload.payment_method?.id ?? null,
      paymentMethodTitle: describeCard({
        card: payload.payment_method?.card,
        title: payload.payment_method?.title
      })
    };
  }

  private toPaymentMethodInfo(payload: PaymentMethodResponse): PaymentMethodInfo {
    return {
      id: payload.id,
      status: payload.status,
      title: describeCard({ card: payload.card, title: payload.title }),
      confirmationUrl: payload.confirmation?.confirmation_url ?? null
    };
  }

  async bindPaymentMethod(input: BindPaymentMethodInput): Promise<PaymentMethodInfo> {
    const payload = await this.request<PaymentMethodResponse>({
      path: '/payment_methods',
      init: {
        method: 'POST',
        body: JSON.stringify({
          type: 'bank_card',
          confirmation: { type: 'redirect', return_url: input.returnUrl }
        })
      },
      idempotenceKey: input.idempotenceKey
    });

    return this.toPaymentMethodInfo(payload);
  }

  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethodInfo> {
    const payload = await this.request<PaymentMethodResponse>({ path: `/payment_methods/${paymentMethodId}`, init: { method: 'GET' } });

    return this.toPaymentMethodInfo(payload);
  }
}
