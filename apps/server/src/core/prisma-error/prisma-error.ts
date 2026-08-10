export type PrismaRequestError = Error & { code: string };

export const isPrismaRequestError = (error: unknown): error is PrismaRequestError =>
  error instanceof Error && 'code' in error && typeof error.code === 'string';
