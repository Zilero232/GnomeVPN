import type { InlineKeyboard } from 'grammy';

import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_TEXT, CALLBACK_PREFIX, CONFIRMED, DECLINED } from '../../../config';
import { deviceAnswer } from '../../callback-value';
import { confirmKeyboard, removeDeviceCopy } from '../confirm-copy';

const deviceId = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const copy = { ask: 'ask', yes: 'yes-label', no: 'no-label' };
const CALLBACK_DATA_LIMIT = 64;

const callbackData = (keyboard: InlineKeyboard): string[] =>
  keyboard.inline_keyboard.flat().map((button) => ('callback_data' in button ? button.callback_data : ''));

describe('confirmKeyboard', () => {
  it('answers yes and no on the prefix it was given', () => {
    expect(callbackData(confirmKeyboard({ copy, prefix: CALLBACK_PREFIX.rotate }))).toEqual([
      `${CALLBACK_PREFIX.rotate}${CONFIRMED}`,
      `${CALLBACK_PREFIX.rotate}${DECLINED}`
    ]);
  });

  it('carries the subject in a payload that reads back to the same device', () => {
    const data = callbackData(confirmKeyboard({ copy, prefix: CALLBACK_PREFIX.removeDevice, subject: deviceId }));
    const answers = data.map((value) => deviceAnswer(value.slice(CALLBACK_PREFIX.removeDevice.length)));

    expect(answers).toEqual([
      { isConfirmed: true, deviceId },
      { isConfirmed: false, deviceId }
    ]);
  });

  it('stays inside what Telegram accepts as callback data', () => {
    for (const value of callbackData(confirmKeyboard({ copy, prefix: CALLBACK_PREFIX.removeDevice, subject: deviceId }))) {
      expect(new TextEncoder().encode(value).length).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
    }
  });
});

describe('removeDeviceCopy', () => {
  it('names the device in the question, in every language', () => {
    for (const locale of BOT_LOCALES) {
      expect(removeDeviceCopy({ copy: BOT_TEXT[locale], name: 'Pixel 8' }).ask).toContain('Pixel 8');
    }
  });
});
