import { isPlaceholderEmail, telegramPlaceholderEmail } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import type { CreateFromTelegramInput } from '../auth.types';

import { auth } from '../../../lib';

@Injectable()
export class IdentityService {
  async createFromTelegram({ telegramId, username }: CreateFromTelegramInput): Promise<string> {
    const adapter = await this.adapter();

    const user = await adapter.createUser(
      {
        email: telegramPlaceholderEmail(telegramId),
        emailVerified: false,
        name: username ?? `tg${telegramId}`
      },
      { method: 'telegram' }
    );

    return user.id;
  }

  async hasRealEmail(userId: string): Promise<boolean> {
    const adapter = await this.adapter();

    const user = await adapter.findUserById(userId);

    return isNonNullish(user) && !isPlaceholderEmail(user.email);
  }

  async deleteUser(userId: string): Promise<void> {
    const adapter = await this.adapter();

    await adapter.deleteUser(userId);
  }

  async issueSessionToken(userId: string): Promise<string> {
    const adapter = await this.adapter();

    const session = await adapter.createSession(userId);

    return session.token;
  }

  private async adapter() {
    const { internalAdapter } = await auth.$context;

    return internalAdapter;
  }
}
