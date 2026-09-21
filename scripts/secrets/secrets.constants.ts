// 32 bytes is what the auth secret needs and more than the webhook signature
// does; one length keeps the script from having to explain two.
export const SECRET_BYTES = 32;

export const SECRET_ENCODINGS = {
  TELEGRAM_WEBHOOK_SECRET: 'hex',
  BETTER_AUTH_SECRET: 'base64'
} as const;
