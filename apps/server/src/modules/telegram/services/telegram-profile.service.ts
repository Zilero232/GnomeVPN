import type { Bot } from 'grammy';
import type { MenuButton } from 'grammy/types';

import { Injectable, Logger } from '@nestjs/common';
import pRetry from 'p-retry';

import type { DescribeInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { BOT_API, BOT_COMMANDS, BOT_LOCALES, BOT_PROFILE, DEFAULT_BOT_LOCALE, FALLBACK_BOT_LOCALE, HTTPS_PROTOCOL } from '../config';
import { profileText, webhookUrl } from '../lib';

@Injectable()
export class TelegramProfileService {
  private readonly logger = new Logger(TelegramProfileService.name);

  constructor(private readonly config: AppConfigService) {}

  async announce(bot: Bot): Promise<void> {
    await this.initialise(bot);

    try {
      await this.describe({ bot, locale: FALLBACK_BOT_LOCALE, isFallback: true });

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

  private async initialise(bot: Bot): Promise<void> {
    await pRetry(() => bot.init(), {
      retries: BOT_API.initAttempts,
      minTimeout: BOT_API.initBackoffMs,
      onFailedAttempt: ({ attemptNumber, error }) => {
        this.logger.warn(`telegram init attempt ${attemptNumber} failed: ${describeError(error)}`);
      }
    });
  }

  private async listen(bot: Bot): Promise<void> {
    const secret = this.config.get('TELEGRAM_WEBHOOK_SECRET');
    const base = this.config.get('TELEGRAM_WEBHOOK_URL');

    if (!secret || !base) {
      this.logger.log('telegram webhook not registered: TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET are both needed');

      return;
    }

    const url = webhookUrl(base);

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

  private async describe({ bot, locale, isFallback }: DescribeInput): Promise<void> {
    const profile = profileText(BOT_PROFILE[locale]);
    const options = isFallback ? {} : { language_code: locale };

    await bot.api.setMyCommands(BOT_COMMANDS[locale], options);
    await bot.api.setMyName(profile.name, options);
    await bot.api.setMyDescription(profile.description, options);
    await bot.api.setMyShortDescription(profile.shortDescription, options);
  }

  private menuButton(): MenuButton {
    const url = this.config.get('CLIENT_URL');

    if (new URL(url).protocol !== HTTPS_PROTOCOL) {
      return { type: 'commands' };
    }

    return {
      type: 'web_app',
      web_app: { url },
      text: BOT_PROFILE[DEFAULT_BOT_LOCALE].menuButton
    };
  }
}
