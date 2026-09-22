import { describe, expect, it } from 'vitest';

import type { TelegramBotService } from '../telegram-bot.service';

import { KEYBOARD_ROWS } from '../../config';
import { TelegramBotService as Bot } from '../telegram-bot.service';

const actionsOf = (): TelegramBotService['actions'] => {
  const bot = Object.create(Bot.prototype) as TelegramBotService;

  return bot.actions;
};

describe('bot actions', () => {
  it('handles every button the keyboard can show, so no press is silently ignored', () => {
    const handled = new Set(actionsOf().flatMap((action) => (action.button ? [action.button] : [])));

    for (const { key } of KEYBOARD_ROWS.flat()) {
      expect(handled.has(key)).toBe(true);
    }
  });

  it('names each command once, because grammY would keep only the last handler', () => {
    const commands = actionsOf().flatMap((action) => (action.command ? [action.command] : []));

    expect(new Set(commands).size).toBe(commands.length);
  });

  it('gives every action something to run', () => {
    for (const action of actionsOf()) {
      expect(typeof action.run).toBe('function');
    }
  });
});
