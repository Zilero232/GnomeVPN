import { afterEach, describe, expect, it, vi } from 'vitest';

import { YooKassaClient } from '../yookassa';

const makeClient = () => new YooKassaClient({ shopId: 'shop-1', secretKey: 'secret-1' });

const paymentInput = {
  amountRub: 100,
  description: 'Vesper',
  returnUrl: 'https://app.test/account',
  idempotenceKey: 'key-1',
  savePaymentMethod: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('YooKassaClient', () => {
  it('шлёт basic-авторизацию и ключ идемпотентности', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'pay-1',
        status: 'pending',
        confirmation: { confirmation_url: 'https://pay.test/1' },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await makeClient().createPayment(paymentInput);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(headers.Authorization).toBe(`Basic ${btoa('shop-1:secret-1')}`);
    expect(headers['Idempotence-Key']).toBe('key-1');
  });

  it('возвращает confirmationUrl и id платежа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          id: 'pay-1',
          status: 'pending',
          confirmation: { confirmation_url: 'https://pay.test/1' },
        }),
      })),
    );

    const result = await makeClient().createPayment(paymentInput);

    expect(result).toEqual({
      id: 'pay-1',
      status: 'pending',
      confirmationUrl: 'https://pay.test/1',
    });
  });

  it('бросает при не-ok ответе', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 400, text: async () => 'bad request' })),
    );

    await expect(makeClient().createPayment(paymentInput)).rejects.toThrow();
  });

  it('автосписание шлёт payment_method_id вместо save_payment_method', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'pay-2', status: 'succeeded' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await makeClient().chargeRecurring({
      amountRub: 100,
      description: 'Vesper',
      paymentMethodId: 'pm-1',
      idempotenceKey: 'key-2',
    });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.payment_method_id).toBe('pm-1');
    expect(body.save_payment_method).toBeUndefined();
    expect(body.capture).toBe(true);
  });

  it('getPayment запрашивает платёж по id', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'pay-1',
        status: 'succeeded',
        payment_method: { id: 'pm-1' },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await makeClient().getPayment('pay-1');

    const [url] = fetchMock.mock.calls[0] as unknown as [string];

    expect(url).toContain('/payments/pay-1');
    expect(result.status).toBe('succeeded');
    expect(result.paymentMethodId).toBe('pm-1');
  });

  it('форматирует сумму с двумя знаками', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'pay-1', status: 'pending' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await makeClient().createPayment({ ...paymentInput, amountRub: 100 });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.amount).toEqual({ value: '100.00', currency: 'RUB' });
  });
});
