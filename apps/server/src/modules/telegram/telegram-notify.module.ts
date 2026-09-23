import { Module } from '@nestjs/common';

import { SubscriptionModule } from '../subscription';
import { telegramBotProvider } from './bot';
import { TelegramNotifyService } from './services/telegram-notify.service';

@Module({
  imports: [SubscriptionModule],
  providers: [telegramBotProvider, TelegramNotifyService],
  exports: [TelegramNotifyService, telegramBotProvider]
})
export class TelegramNotifyModule {}
