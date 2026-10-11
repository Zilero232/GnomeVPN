import { InlineKeyboard } from 'grammy';

import type { BotMessage } from '../../telegram.types';
import type { UrlMessageInput } from './url-message.types';

import { isButtonUrl } from '../button-url';
import { html } from '../html';

export const urlMessage = ({ intro, url, label, style }: UrlMessageInput): BotMessage => {
  if (!isButtonUrl(url)) {
    return { text: html.paragraphs([intro, html.escape(url)]) };
  }

  return { text: intro, markup: new InlineKeyboard().url(label, url).style(style) };
};
