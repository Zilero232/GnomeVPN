import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'PAYMENT_REQUIRED',
  'PAYMENT_FAILED',
  'WEBHOOK_INVALID',
  'NODE_NOT_FOUND',
  'NODE_UNAVAILABLE',
  'TUNNEL_FAILED',
  'INTERNAL_ERROR',
]);
