import type { Bot, Context } from 'grammy';

import type { BOT_LOCALES } from './config';

export type BotLocale = (typeof BOT_LOCALES)[number];

export type BotContext = Context;

export type BotMessages = typeof import('./config/locales/ru.json');

export type BotText = BotMessages['text'];

export type BotProfile = BotMessages['profile'];

export type BotCommand = {
  command: string;
  description: string;
};

export type IssueLinkCodeResult = {
  code: string;
  expiresAt: string;
  botUsername: string;
};

export type ConsumeLinkCodeInput = {
  code: string;
  telegramId: bigint;
  username: string | null;
  languageCode: string | null;
};

export type TelegramIdentity = {
  telegramId: bigint;
  username: string | null;
  languageCode: string | null;
};

export type LinkedAccount = {
  userId: string;
  telegramId: bigint;
  username: string | null;
};

export type ResolvedChat = {
  userId: string;
  locale: BotLocale;
};

export type WithUserInput = {
  ctx: BotContext;
  act: (chat: ResolvedChat) => Promise<unknown>;
};

export type ConsumeInput = {
  ctx: BotContext;
  text: string;
};

export type DescribeInput = {
  bot: Bot;
  locale: BotLocale;
};

export type RefusalInput = {
  error: unknown;
  copy: BotText;
};

export type ReplyWithLinkInput = {
  ctx: BotContext;
  chat: ResolvedChat;
};

export type ReplyWithPlansInput = {
  ctx: BotContext;
  locale: BotLocale;
};

export type SetLocaleInput = {
  telegramId: bigint;
  locale: BotLocale;
};

export type ClaimTrialInput = {
  ctx: BotContext;
  userId: string;
  locale: BotLocale;
};
