import type { ApiErrorCode } from '@gnomevpn/schemas';

export type ApiErrorInput = {
  code: ApiErrorCode;
  message: string;
};
