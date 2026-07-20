import { HttpException } from '@nestjs/common';

export const describeError = (error: unknown): string => {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    return typeof response === 'string' ? response : JSON.stringify(response);
  }

  return error instanceof Error ? error.message : String(error);
};
