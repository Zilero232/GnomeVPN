import type { KeyboardButton } from 'grammy/types';

import { describe, expect, it } from 'vitest';

import type { ChatState } from '../keyboard.types';

import { BOT_BUTTONS, BOT_LOCALES } from '../../../config';
import { mainKeyboard } from '../keyboard';
import { buttonFor } from '../keyboard.helpers';

const textOf = (button: KeyboardButton): string => (typeof button === 'string' ? button : button.text);

const labelsOf = (state: ChatState, locale: 'en' | 'ru' = 'ru') => mainKeyboard({ locale, state }).build().flat().map(textOf);

const fresh: ChatState = { isSubscribed: false, isTrialAvailable: true };
const paying: ChatState = { isSubscribed: true, isTrialAvailable: false };
const lapsed: ChatState = { isSubscribed: false, isTrialAvailable: false };

describe('mainKeyboard', () => {
  it('offers the trial to someone who can still take it', () => {
    expect(labelsOf(fresh)).toContain(BOT_BUTTONS.ru.trial);
  });

  it('does not offer a trial that is already spent', () => {
    expect(labelsOf(paying)).not.toContain(BOT_BUTTONS.ru.trial);
    expect(labelsOf(lapsed)).not.toContain(BOT_BUTTONS.ru.trial);
  });

  it('hides the link and the status from someone with nothing to connect to', () => {
    expect(labelsOf(fresh)).not.toContain(BOT_BUTTONS.ru.connect);
    expect(labelsOf(fresh)).not.toContain(BOT_BUTTONS.ru.status);
  });

  it('leads with the link once there is a subscription to use', () => {
    const [first] = labelsOf(paying);

    expect(first).toBe(BOT_BUTTONS.ru.connect);
  });

  it('offers a way to pay in every state, worded for that state', () => {
    expect(labelsOf(fresh)).toContain(BOT_BUTTONS.ru.buy);
    expect(labelsOf(lapsed)).toContain(BOT_BUTTONS.ru.buy);
    expect(labelsOf(paying)).toContain(BOT_BUTTONS.ru.renew);
  });

  it('does not ask a paying reader to subscribe, nor a lapsed one to renew', () => {
    expect(labelsOf(paying)).not.toContain(BOT_BUTTONS.ru.buy);
    expect(labelsOf(lapsed)).not.toContain(BOT_BUTTONS.ru.renew);
  });

  it('never renders an empty row', () => {
    for (const state of [fresh, paying, lapsed]) {
      for (const row of mainKeyboard({ locale: 'ru', state }).build()) {
        expect(row.length).toBeGreaterThan(0);
      }
    }
  });

  it('speaks the locale it is given', () => {
    expect(labelsOf(paying, 'en')).toContain(BOT_BUTTONS.en.connect);
    expect(labelsOf(paying, 'en')).not.toContain(BOT_BUTTONS.ru.connect);
  });
});

describe('buttonFor', () => {
  it('recognises every label in every language', () => {
    for (const locale of BOT_LOCALES) {
      for (const [key, label] of Object.entries(BOT_BUTTONS[locale])) {
        expect(buttonFor(label)).toBe(key);
      }
    }
  });

  it('survives the whitespace a client may add', () => {
    expect(buttonFor(`  ${BOT_BUTTONS.ru.status}  `)).toBe('status');
  });

  it('refuses anything that is not a button, so a link code still reads as one', () => {
    expect(buttonFor('ABCD2345')).toBeNull();
    expect(buttonFor('')).toBeNull();
    expect(buttonFor('Подписка')).toBeNull();
  });
});
