import { secondsInDay } from 'date-fns/constants';

export const SESSION = {
  expiresIn: 30 * secondsInDay,
  updateAge: secondsInDay
} as const;

export const EMAIL_FIELD_BY_PATH: Readonly<Record<string, string>> = {
  '/sign-up/email': 'email',
  '/change-email': 'newEmail'
};
