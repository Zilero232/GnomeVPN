import type { OnModuleInit } from '@nestjs/common';
import type { Update } from 'grammy/types';

import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { PressInput } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { BOT_API, CALLBACK_PREFIX } from '../config';
import { buttonFor, callbackPattern } from '../lib';
import { TelegramAccountService } from './telegram-account.service';
import { TelegramProfileService } from './telegram-profile.service';
import { TelegramSharedService } from './telegram-shared.service';
import { TelegramSubscriptionService } from './telegram-subscription.service';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly bot: Bot | null;
  private ready: Promise<void> = Promise.resolve();

  constructor(
    private readonly config: AppConfigService,
    private readonly shared: TelegramSharedService,
    private readonly account: TelegramAccountService,
    private readonly subscription: TelegramSubscriptionService,
    private readonly profile: TelegramProfileService
  ) {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');

    this.bot = token ? new Bot(token, { client: { timeoutSeconds: BOT_API.timeoutSeconds } }) : null;

    if (this.bot) {
      this.register(this.bot);
    }
  }

  get isEnabled(): boolean {
    return !isNullish(this.bot);
  }

  onModuleInit(): void {
    if (!this.bot) {
      this.logger.log('telegram bot is disabled: no token configured');

      return;
    }

    this.ready = this.profile.announce(this.bot);

    this.ready.catch((error: unknown) => {
      this.logger.error(`telegram bot could not initialise: ${describeError(error)}`);
    });
  }

  async handleUpdate(update: Update): Promise<void> {
    if (!this.bot) {
      return;
    }

    try {
      await this.ready;
      await this.bot.handleUpdate(update);
    } catch (error) {
      this.logger.error(`telegram update failed: ${describeError(error)}`);
    }
  }

  private register(bot: Bot): void {
    bot.command('start', (ctx) => {
      const code = ctx.match;

      return code ? this.account.consume({ ctx, text: code }) : this.account.welcome(ctx);
    });

    bot.command('help', (ctx) => this.account.help(ctx));
    bot.command('language', (ctx) => this.account.chooseLanguage(ctx));
    bot.command('status', (ctx) => this.subscription.status(ctx));
    bot.command('link', (ctx) => this.subscription.sendLink(ctx));
    bot.command('buy', (ctx) => this.subscription.buy(ctx));
    bot.command('trial', (ctx) => this.subscription.claimTrialDay(ctx));
    bot.command('unlink', (ctx) => this.account.unlink(ctx));

    bot.callbackQuery(callbackPattern(CALLBACK_PREFIX.plan), (ctx) => this.subscription.startCheckout(ctx));
    bot.callbackQuery(callbackPattern(CALLBACK_PREFIX.locale), (ctx) => this.account.changeLocale(ctx));

    bot.on('message:text', (ctx) => {
      const button = buttonFor(ctx.message.text);

      return isNullish(button) ? this.account.consume({ ctx, text: ctx.message.text }) : this.press({ ctx, button });
    });
  }

  private press({ ctx, button }: PressInput): Promise<void> {
    return match(button)
      .with('connect', () => this.subscription.sendLink(ctx))
      .with('status', () => this.subscription.status(ctx))
      .with('trial', () => this.subscription.claimTrialDay(ctx))
      .with('buy', () => this.subscription.buy(ctx))
      .with('language', () => this.account.chooseLanguage(ctx))
      .with('help', () => this.account.help(ctx))
      .exhaustive();
  }
}
