import type { OnModuleInit } from '@nestjs/common';
import type { Update } from 'grammy/types';

import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { isNonNullish, isNullish } from 'remeda';

import type { BotAction, BotCallback, BotContext } from '../telegram.types';

import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { BOT_API, CALLBACK_PREFIX } from '../config';
import { buttonFor, callbackPattern, looksLikeLinkCode } from '../lib';
import { TelegramAccountService } from './telegram-account.service';
import { TelegramAppsService } from './telegram-apps.service';
import { TelegramBillingService } from './telegram-billing.service';
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
    private readonly apps: TelegramAppsService,
    private readonly billing: TelegramBillingService,
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

  get actions(): BotAction[] {
    return [
      { command: 'connect', button: 'connect', run: (ctx) => this.subscription.sendLink(ctx) },
      { command: 'link', run: (ctx) => this.subscription.sendLink(ctx) },
      { command: 'status', button: 'status', run: (ctx) => this.subscription.status(ctx) },
      { command: 'buy', button: 'buy', run: (ctx) => this.subscription.buy(ctx) },
      { button: 'renew', run: (ctx) => this.subscription.buy(ctx) },
      { command: 'trial', button: 'trial', run: (ctx) => this.subscription.claimTrialDay(ctx) },
      { command: 'apps', button: 'apps', run: (ctx) => this.apps.list(ctx) },
      { command: 'devices', button: 'devices', run: (ctx) => this.billing.devices(ctx) },
      { command: 'rotate', button: 'rotate', run: (ctx) => this.billing.askRotate(ctx) },
      { button: 'autoRenew', run: (ctx) => this.billing.autoRenew(ctx) },
      { command: 'website', run: (ctx) => this.account.openWebsite(ctx) },
      { command: 'language', button: 'language', run: (ctx) => this.account.chooseLanguage(ctx) },
      { command: 'help', button: 'help', run: (ctx) => this.account.help(ctx) },
      { command: 'unlink', button: 'unlink', run: (ctx) => this.account.askUnlink(ctx) },
      { command: 'delete', button: 'deleteAccount', run: (ctx) => this.account.askDelete(ctx) }
    ];
  }

  private get callbacks(): BotCallback[] {
    return [
      { prefix: CALLBACK_PREFIX.plan, run: (ctx) => this.subscription.startCheckout(ctx) },
      { prefix: CALLBACK_PREFIX.locale, run: (ctx) => this.account.changeLocale(ctx) },
      { prefix: CALLBACK_PREFIX.client, run: (ctx) => this.apps.show(ctx) },
      { prefix: CALLBACK_PREFIX.unlink, run: (ctx) => this.account.confirmUnlink(ctx) },
      { prefix: CALLBACK_PREFIX.deleteAccount, run: (ctx) => this.account.confirmDelete(ctx) },
      { prefix: CALLBACK_PREFIX.rotate, run: (ctx) => this.billing.confirmRotate(ctx) },
      { prefix: CALLBACK_PREFIX.autoRenew, run: (ctx) => this.billing.changeAutoRenew(ctx) },
      { prefix: CALLBACK_PREFIX.devices, run: (ctx) => this.billing.buyDevices(ctx) }
    ];
  }

  private register(bot: Bot): void {
    bot.command('start', (ctx) => this.start(ctx));

    for (const { command, run } of this.actions) {
      if (command) {
        bot.command(command, run);
      }
    }

    for (const { prefix, run } of this.callbacks) {
      bot.callbackQuery(callbackPattern(prefix), run);
    }

    bot.on('message:text', (ctx) => this.read(ctx));
  }

  private start(ctx: BotContext): Promise<void> {
    const code = typeof ctx.match === 'string' ? ctx.match : '';

    return looksLikeLinkCode(code) ? this.account.consume({ ctx, text: code }) : this.account.welcome(ctx);
  }

  private read(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text ?? '';
    const button = buttonFor(text);
    const pressed = this.actions.find((action) => action.button === button);

    if (isNonNullish(pressed)) {
      return pressed.run(ctx);
    }

    return looksLikeLinkCode(text) ? this.account.consume({ ctx, text }) : this.account.help(ctx);
  }
}
