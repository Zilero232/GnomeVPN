import { HttpException } from '@nestjs/common';
import { isString } from 'remeda';

export const describeError = (error: unknown): string => {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    return isString(response) ? response : JSON.stringify(response);
  }

  return error instanceof Error ? error.message : String(error);
};
