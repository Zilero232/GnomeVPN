import { describe, expect, it } from 'vitest';

import type { BotLocale } from '../../telegram.types';

import { BOT_COMMANDS, BOT_LOCALES, BOT_PROFILE, BOT_TEXT, DEFAULT_BOT_LOCALE } from '../telegram.messages';

const otherLocale = (locale: BotLocale): BotLocale => (locale === 'ru' ? 'en' : 'ru');

describe('bot messages', () => {
  it('serves every locale it advertises', () => {
    for (const locale of BOT_LOCALES) {
      expect(BOT_TEXT[locale]).toBeDefined();
      expect(BOT_PROFILE[locale]).toBeDefined();
      expect(BOT_COMMANDS[locale]).toBeDefined();
    }
  });

  it('has a default that is one of them', () => {
    expect(BOT_LOCALES).toContain(DEFAULT_BOT_LOCALE);
  });

  it('leaves no string empty in either language', () => {
    for (const locale of BOT_LOCALES) {
      for (const [key, value] of Object.entries(BOT_TEXT[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });

  it('translates rather than repeating the other language', () => {
    for (const locale of BOT_LOCALES) {
      expect(BOT_TEXT[locale].start).not.toBe(BOT_TEXT[otherLocale(locale)].start);
      expect(BOT_PROFILE[locale].description).not.toBe(BOT_PROFILE[otherLocale(locale)].description);
    }
  });

  it('keeps the placeholders of the status lines in both languages', () => {
    for (const locale of BOT_LOCALES) {
      expect(BOT_TEXT[locale].activeUntil).toContain('{date}');
      expect(BOT_TEXT[locale].planLine).toContain('{plan}');
      expect(BOT_TEXT[locale].devicesLine).toContain('{count}');
    }
  });
});

describe('bot commands', () => {
  it('offers the same commands in every language', () => {
    const [first, ...rest] = BOT_LOCALES.map((locale) => BOT_COMMANDS[locale].map((entry) => entry.command));

    for (const commands of rest) {
      expect(commands).toEqual(first);
    }
  });

  it('describes each command without an empty label', () => {
    for (const locale of BOT_LOCALES) {
      for (const { command, description } of BOT_COMMANDS[locale]) {
        expect(command).toMatch(/^[a-z_]+$/u);
        expect(description.trim()).not.toBe('');
      }
    }
  });

  it('lists every command the help text mentions', () => {
    for (const locale of BOT_LOCALES) {
      const mentioned = [...BOT_TEXT[locale].help.matchAll(/\/(?<name>[a-z]+)/gu)].map((match) => match.groups?.name);
      const registered = BOT_COMMANDS[locale].map((entry) => entry.command);

      expect([...mentioned].sort()).toEqual([...registered].sort());
    }
  });
});

describe('bot profile', () => {
  it('keeps the short description inside what Telegram accepts', () => {
    for (const locale of BOT_LOCALES) {
      expect(BOT_PROFILE[locale].shortDescription.length).toBeLessThanOrEqual(120);
      expect(BOT_PROFILE[locale].description.length).toBeLessThanOrEqual(512);
      expect(BOT_PROFILE[locale].name.length).toBeLessThanOrEqual(64);
    }
  });

  it('names a menu button in every language', () => {
    for (const locale of BOT_LOCALES) {
      expect(BOT_PROFILE[locale].menuButton.trim()).not.toBe('');
    }
  });
});
