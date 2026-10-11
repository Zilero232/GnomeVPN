import type { ClientId, DeviceList } from '@gnomevpn/schemas';
import type { Bot, Context, InlineKeyboard } from 'grammy';

import type { Prisma } from '../../../generated';
import type { AUTO_RENEW_CHOICE, BOT_LOCALES, NOTICES } from './config';
import type { TextFill } from './lib/fill-text';
import type { ButtonKey } from './lib/keyboard';

export type BotLocale = (typeof BOT_LOCALES)[number];

export type BotContext = Context;

export type BotMessages = typeof import('./config/locales/ru.json');

export type BotText = BotMessages['text'];

export type BotButtons = BotMessages['buttons'];

export type BotPlatforms = BotMessages['platforms'];

export type BotProfile = BotMessages['profile'];

export type BotCommand = {
  command: string;
  description: string;
};

export type AutoRenewChoice = (typeof AUTO_RENEW_CHOICE)[keyof typeof AUTO_RENEW_CHOICE];

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

export type TelegramIdentity = {
  telegramId: bigint;
  username: string | null;
  languageCode: string | null;
};

export type ResolvedChat = {
  userId: string;
  telegramId: bigint;
  locale: BotLocale;
};

export type LinkedAccount = {
  userId: string;
  telegramId: bigint;
  username: string | null;
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

export type SetLocaleInput = {
  telegramId: bigint;
  locale: BotLocale;
};

export type UntouchedUserInput = {
  tx: Prisma.TransactionClient;
  userId: string;
};

export type BotMessage = {
  text: string;
  markup?: InlineKeyboard;
};

export type ReplyInput = BotMessage & {
  ctx: BotContext;
  chat: ResolvedChat | null;
  effect?: string;
};

export type EditInput = BotMessage & {
  ctx: BotContext;
};

export type WithUserInput = {
  ctx: BotContext;
  act: (chat: ResolvedChat) => Promise<unknown>;
};

export type AttemptInput = {
  ctx: BotContext;
  chat: ResolvedChat;
  act: () => Promise<unknown>;
};

export type Answer = {
  chat: ResolvedChat;
  value: string;
};

export type AnsweredInput = {
  ctx: BotContext;
  prefix: string;
  act: (answer: Answer) => Promise<unknown>;
};

export type ConfirmCopy = {
  ask: string;
  yes: string;
  no: string;
};

export type AskInput = {
  ctx: BotContext;
  prefix: string;
  pick: (copy: BotText) => ConfirmCopy;
};

export type ConfirmedInput = {
  ctx: BotContext;
  prefix: string;
  cancelled: (copy: BotText) => string;
  act: (chat: ResolvedChat) => Promise<unknown>;
};

export type SpeakInput = {
  ctx: BotContext;
  pick: (copy: BotText) => string;
};

export type ChatCopy = {
  chat: ResolvedChat | null;
  copy: BotText;
};

export type ConsumeInput = {
  ctx: BotContext;
  text: string;
};

export type RefusalInput = {
  error: unknown;
  copy: BotText;
};

export type ShowClientInput = {
  ctx: BotContext;
  chat: ResolvedChat;
  id: ClientId;
};

export type DevicesViewInput = {
  chat: ResolvedChat;
  notice?: string;
  list?: DeviceList;
};

export type DescribeInput = {
  bot: Bot;
  locale: BotLocale;
  isFallback?: boolean;
};

export type NoticeSpec = {
  markup: 'main' | readonly ButtonKey[];
  effect?: string;
};

export type NoticeKey = keyof typeof NOTICES & keyof BotText;

export type MarkupForInput = {
  userId: string;
  locale: BotLocale;
  markup: NoticeSpec['markup'];
};

export type NotifyInput = {
  userId: string;
  notice: NoticeKey;
  fill?: TextFill;
  date?: Date | null;
};

export type RemovalInput = {
  userId: string;
  deviceId: string;
  copy: BotText;
};
