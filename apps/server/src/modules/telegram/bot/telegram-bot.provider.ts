import { autoRetry } from '@grammyjs/auto-retry';
import { Bot } from 'grammy';

import { AppConfigService } from '../../../config';
import { BOT_API } from '../config';
import { retryNetworkErrors, sendDefaults } from '../lib';
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

    bot.api.config.use(autoRetry({ maxRetryAttempts: BOT_API.callRetries, maxDelaySeconds: BOT_API.maxDelaySeconds, rethrowHttpErrors: true }));

    bot.api.config.use(sendDefaults);

    return bot;
  },
  inject: [AppConfigService]
};
