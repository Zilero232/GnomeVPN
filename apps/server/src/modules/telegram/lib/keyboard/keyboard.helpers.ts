import { entries } from 'remeda';

import type { ButtonKey } from './keyboard.types';

import { BOT_BUTTONS, BOT_LOCALES } from '../../config';

const BY_LABEL = new Map<string, ButtonKey>(
  BOT_LOCALES.flatMap((locale) => entries(BOT_BUTTONS[locale]).map(([key, label]): [string, ButtonKey] => [label, key]))
);

export const buttonFor = (text: string): ButtonKey | null => BY_LABEL.get(text.trim()) ?? null;
