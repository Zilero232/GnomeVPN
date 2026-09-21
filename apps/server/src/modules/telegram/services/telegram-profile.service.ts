import type { Bot } from 'grammy';
import type { MenuButton } from 'grammy/types';

import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { DescribeInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { BOT_COMMANDS, BOT_LOCALES, BOT_PROFILE, DEFAULT_BOT_LOCALE, HTTPS_PREFIX } from '../config';
import { webhookUrl } from '../lib';

@Injectable()
export class TelegramProfileService {
  private readonly logger = new Logger(TelegramProfileService.name);

  constructor(private readonly config: AppConfigService) {}

  async announce(bot: Bot): Promise<void> {
    await bot.init();

    try {
      for (const locale of BOT_LOCALES) {
        await this.describe({ bot, locale });
      }

      await bot.api.setChatMenuButton({ menu_button: this.menuButton() });
      await this.listen(bot);

      this.logger.log('telegram bot is ready');
    } catch (error) {
      this.logger.warn(`telegram bot could not reach the api: ${describeError(error)}`);
    }
  }

  private async listen(bot: Bot): Promise<void> {
    const secret = this.config.get('TELEGRAM_WEBHOOK_SECRET');
    const url = webhookUrl({ apiUrl: this.config.get('API_URL'), secret });

    if (isNullish(url)) {
      this.logger.log('telegram webhook not registered: needs an https API_URL and a webhook secret');

      return;
    }

    const current = await bot.api.getWebhookInfo();

    if (current.last_error_message) {
      this.logger.warn(`telegram could not deliver to the last webhook: ${current.last_error_message}`);
    }

    if (current.pending_update_count > 0) {
      this.logger.warn(`${current.pending_update_count} telegram updates are waiting to be delivered`);
    }

    if (current.url === url && !current.last_error_message) {
      this.logger.log(`telegram webhook is already ${url}`);

      return;
    }

    await bot.api.setWebhook(url, { secret_token: secret });

    this.logger.log(`telegram webhook set to ${url}`);
  }

  private async describe({ bot, locale }: DescribeInput): Promise<void> {
    const profile = BOT_PROFILE[locale];
    const options = { language_code: locale };

    await bot.api.setMyCommands(BOT_COMMANDS[locale], options);
    await bot.api.setMyName(profile.name, options);
    await bot.api.setMyDescription(profile.description, options);
    await bot.api.setMyShortDescription(profile.shortDescription, options);
  }

  private menuButton(): MenuButton {
    const url = this.config.get('CLIENT_URL');

    if (!url.startsWith(HTTPS_PREFIX)) {
      return { type: 'commands' };
    }

    return {
      type: 'web_app',
      web_app: { url },
      text: BOT_PROFILE[DEFAULT_BOT_LOCALE].menuButton
    };
  }
}
