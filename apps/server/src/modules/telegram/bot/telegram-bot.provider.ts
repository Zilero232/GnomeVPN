import { Bot } from 'grammy';

import { AppConfigService } from '../../../config';
import { BOT_API } from '../config';
import { retryNetworkErrors } from '../lib';
import { TELEGRAM_BOT } from './telegram-bot.constants';

export const telegramBotProvider = {
  provide: TELEGRAM_BOT,
  useFactory: (config: AppConfigService): Bot | null => {
    const token = config.get('TELEGRAM_BOT_TOKEN');

    if (!token) {
      return null;
    }

    const bot = new Bot(token, { client: { timeoutSeconds: BOT_API.timeoutSeconds } });

    bot.api.config.use(retryNetworkErrors);

    return bot;
  },
  inject: [AppConfigService]
};
