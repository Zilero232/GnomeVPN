import type { ApiErrorCode } from '@gnomevpn/schemas';

import { STATUS_TO_CODE } from './all-exceptions.constants';

export const codeForStatus = (status: number): ApiErrorCode => STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
