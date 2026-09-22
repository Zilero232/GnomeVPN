import type { ClientId } from '@gnomevpn/schemas';
import type { Bot, Context } from 'grammy';

import type { Prisma } from '../../../generated';
import type { AUTO_RENEW_CHOICE, BOT_LOCALES } from './config';

export type BotLocale = (typeof BOT_LOCALES)[number];

export type BotContext = Context;

export type BotMessages = typeof import('./config/locales/ru.json');

export type BotText = BotMessages['text'];

export type BotButtons = BotMessages['buttons'];

export type BotPlatforms = BotMessages['platforms'];

export type ButtonKey = keyof BotButtons;

export type ButtonVisibility = 'always' | 'subscribed' | 'trialAvailable' | 'unsubscribed';

export type KeyboardSlot = {
  key: ButtonKey;
  when: ButtonVisibility;
};

export type KeyboardRow = KeyboardSlot[];

export type ChatState = {
  isSubscribed: boolean;
  isTrialAvailable: boolean;
};

export type SpeakInput = {
  ctx: BotContext;
  pick: (copy: BotText) => string;
};

export type ChatCopy = {
  chat: ResolvedChat | null;
  copy: BotText;
};

export type ShowClientInput = {
  ctx: BotContext;
  chat: ResolvedChat;
  id: ClientId;
};

export type AutoRenewChoice = (typeof AUTO_RENEW_CHOICE)[keyof typeof AUTO_RENEW_CHOICE];

export type Answer = {
  chat: ResolvedChat;
  value: string;
};

export type AnsweredInput = {
  ctx: BotContext;
  prefix: string;
  act: (answer: Answer) => Promise<unknown>;
};

export type AttemptInput = {
  ctx: BotContext;
  chat: ResolvedChat;
  act: () => Promise<unknown>;
};

export type BotHandler = (ctx: BotContext) => Promise<void>;

export type BotAction = {
  command?: string;
  button?: ButtonKey;
  run: BotHandler;
};

export type BotCallback = {
  prefix: string;
  run: BotHandler;
};

export type ReplyInput = {
  ctx: BotContext;
  text: string;
  chat: ResolvedChat | null;
};

export type VisibilityInput = {
  when: ButtonVisibility;
  state: ChatState;
};

export type KeyboardInput = {
  locale: BotLocale;
  state: ChatState;
};

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
  telegramId: bigint;
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
  isFallback?: boolean;
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
  chat: ResolvedChat;
};

export type UntouchedUserInput = {
  tx: Prisma.TransactionClient;
  userId: string;
};
