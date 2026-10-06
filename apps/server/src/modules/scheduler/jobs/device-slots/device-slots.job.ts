import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isEmpty } from 'remeda';

import { describeError } from '../../../../common/lib';
import { DEVICE_TITLE, DevicesService } from '../../../devices';
import { TelegramNotifyService } from '../../../telegram/services/telegram-notify.service';

@Injectable()
export class DeviceSlotsJob {
  private readonly logger = new Logger(DeviceSlotsJob.name);

  constructor(
    private readonly devices: DevicesService,
    private readonly notify: TelegramNotifyService
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    try {
      const revocations = await this.devices.revokeOverLimit();

      if (isEmpty(revocations)) {
        return;
      }

      this.logger.log(`Revoked the keys of devices over the limit on ${revocations.length} account(s)`);

      await Promise.all(
        revocations.map(({ userId, deviceLimit, titles }) =>
          this.notify.tell({
            userId,
            pick: (copy) => copy.devicesShrunk,
            fill: { limit: String(deviceLimit), names: titles.join(DEVICE_TITLE.listSeparator) }
          })
        )
      );
    } catch (error) {
      this.logger.warn(`Device slot sweep failed: ${describeError(error)}`);
    }
  }
}
