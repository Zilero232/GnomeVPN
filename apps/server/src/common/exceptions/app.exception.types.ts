import type { ApiErrorCode } from '@gnomevpn/schemas';

export type AppErrorBody = {
  code: ApiErrorCode;
  error: string;
};
