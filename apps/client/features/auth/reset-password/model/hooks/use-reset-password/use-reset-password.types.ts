import type { ResetPasswordValues } from '@gnomevpn/schemas';

export type ResetPasswordInput = ResetPasswordValues & {
  token: string;
};
