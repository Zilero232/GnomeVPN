import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';

import type { BotProfile } from '../../telegram.types';

import { PRICE_TOKEN } from './profile-text.constants';

const withPrice = (text: string): string => text.replaceAll(PRICE_TOKEN, String(LOWEST_MONTHLY_RUB));

export const profileText = ({ description, shortDescription, ...rest }: BotProfile): BotProfile => ({
  ...rest,
  description: withPrice(description),
  shortDescription: withPrice(shortDescription)
});
