import { Bot } from 'grammy';

import { AppConfigService } from '../../../config';
import { BOT_API } from '../config';
import { TELEGRAM_BOT } from './telegram-bot.constants';

export const telegramBotProvider = {
  provide: TELEGRAM_BOT,
  useFactory: (config: AppConfigService): Bot | null => {
    const token = config.get('TELEGRAM_BOT_TOKEN');

    return token ? new Bot(token, { client: { timeoutSeconds: BOT_API.timeoutSeconds } }) : null;
  },
  inject: [AppConfigService]
};
