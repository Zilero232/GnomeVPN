import { entries } from 'remeda';

import type { BotButtons, BotCommand, BotLocale, BotMessages, BotPlatforms, BotProfile, BotText } from '../telegram.types';

import en from './locales/en.json';
import ru from './locales/ru.json';

export const BOT_LOCALES = ['ru', 'en'] as const;

export const DEFAULT_BOT_LOCALE: BotLocale = 'ru';

export const FALLBACK_BOT_LOCALE: BotLocale = 'en';

const MESSAGES: Record<BotLocale, BotMessages> = { ru, en };

export const BOT_TEXT: Record<BotLocale, BotText> = {
  ru: MESSAGES.ru.text,
  en: MESSAGES.en.text
};

export const BOT_BUTTONS: Record<BotLocale, BotButtons> = {
  ru: MESSAGES.ru.buttons,
  en: MESSAGES.en.buttons
};

export const BOT_PLATFORMS: Record<BotLocale, BotPlatforms> = {
  ru: MESSAGES.ru.platforms,
  en: MESSAGES.en.platforms
};

export const BOT_PROFILE: Record<BotLocale, BotProfile> = {
  ru: MESSAGES.ru.profile,
  en: MESSAGES.en.profile
};

const commandsOf = (locale: BotLocale): BotCommand[] =>
  entries(MESSAGES[locale].commands).map(([command, description]) => ({ command, description }));

export const BOT_COMMANDS: Record<BotLocale, BotCommand[]> = {
  ru: commandsOf('ru'),
  en: commandsOf('en')
};
