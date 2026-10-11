import { InlineKeyboard } from 'grammy';

import type { BotMessage } from '../../telegram.types';
import type { LinkMessageInput } from './link-message.types';

import { BOT_TEXT } from '../../config';
import { html } from '../html';
import { menuButtons } from '../keyboard';

export const linkMessage = ({ locale, intro, url }: LinkMessageInput): BotMessage => {
  const text = BOT_TEXT[locale];
  const markup = new InlineKeyboard()
    .copyText(text.appsCopyLink, url)
    .primary()
    .row()
    .append(menuButtons({ locale, keys: ['apps'] }));

  return { text: html.paragraphs([intro, html.code(url), text.linkWarning]), markup };
};
