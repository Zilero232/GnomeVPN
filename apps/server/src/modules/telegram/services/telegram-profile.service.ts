import type { Bot } from 'grammy';
import type { MenuButton } from 'grammy/types';

import { Injectable, Logger } from '@nestjs/common';

import type { DescribeInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { BOT_COMMANDS, BOT_LOCALES, BOT_PROFILE, DEFAULT_BOT_LOCALE, HTTPS_PREFIX } from '../config';

@Injectable()
export class TelegramProfileService {
  private readonly logger = new Logger(TelegramProfileService.name);

  constructor(private readonly config: AppConfigService) {}

  async announce(bot: Bot): Promise<void> {
    try {
      await bot.init();

      for (const locale of BOT_LOCALES) {
        await this.describe({ bot, locale });
      }

      await bot.api.setChatMenuButton({ menu_button: this.menuButton() });

      this.logger.log('telegram bot is ready');
    } catch (error) {
      this.logger.warn(`telegram bot could not reach the api: ${describeError(error)}`);
    }
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
      text: BOT_PROFILE[DEFAULT_BOT_LOCALE].menuButton,
      web_app: { url }
    };
  }
}
