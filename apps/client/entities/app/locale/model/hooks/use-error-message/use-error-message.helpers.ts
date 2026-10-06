import { apiErrorCode, AuthError } from '@/shared/api';

export const errorMessageKey = (error: unknown): string => (error instanceof AuthError ? `auth.${error.message}` : `errors.${apiErrorCode(error)}`);
