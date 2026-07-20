// YooKassa's published webhook source ranges, plus loopback for local testing.
// https://yookassa.ru/developers/using-api/webhooks — verified 2026-07-20.
export const WEBHOOK_ALLOWED_CIDRS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11/32',
  '77.75.156.35/32',
  '77.75.154.128/25',
  '2a02:5180::/32',
  '127.0.0.1/32',
  '::1/128',
];
