import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'PAYMENT_REQUIRED',
  'NODE_NOT_FOUND',
  'NODE_UNAVAILABLE',
  'TUNNEL_FAILED',
  'INTERNAL_ERROR',
]);
