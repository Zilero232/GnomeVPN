import { ASCII_PRINTABLE, BASE64_PREFIX } from './header-value.constants';

const isAscii = (value: string) => ASCII_PRINTABLE.test(value);

export const headerValue = (value: string): string => (isAscii(value) ? value : `${BASE64_PREFIX}${Buffer.from(value, 'utf8').toString('base64')}`);
