import { deviceIdParamSchema } from '@gnomevpn/schemas';
import { isNullish } from 'remeda';

import type { AutoRenewChoice } from '../../telegram.types';
import type { CountFromInput, DeviceAnswer } from './callback-value.types';

import { AUTO_RENEW_CHOICE, CONFIRMED, DECLINED, SUBJECT_SEPARATOR } from '../../config';
import { ANSWER_PARTS, DIGITS } from './callback-value.constants';

export const isConfirmed = (raw: string): boolean => raw === CONFIRMED;

export const countFrom = ({ raw, max }: CountFromInput): number | null => {
  if (!DIGITS.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  return parsed > 0 && parsed <= max ? parsed : null;
};

export const autoRenewChoice = (raw: string): AutoRenewChoice | null => (raw === AUTO_RENEW_CHOICE.on || raw === AUTO_RENEW_CHOICE.off ? raw : null);

export const parseDeviceId = (raw: string): string | null => (deviceIdParamSchema.safeParse({ id: raw }).success ? raw : null);

export const deviceAnswer = (raw: string): DeviceAnswer | null => {
  const parts = raw.split(SUBJECT_SEPARATOR);

  if (parts.length !== ANSWER_PARTS) {
    return null;
  }

  const [answer, subject] = parts;
  const deviceId = parseDeviceId(subject);

  if (isNullish(deviceId) || (answer !== CONFIRMED && answer !== DECLINED)) {
    return null;
  }

  return { isConfirmed: answer === CONFIRMED, deviceId };
};
