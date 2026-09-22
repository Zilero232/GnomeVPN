import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { WEB_LOGIN } from './config';
import { TelegramWebLoginDto, TelegramWidgetDto } from './dto';
import { TelegramWebLoginService } from './services';

@Controller('telegram/web-login')
export class TelegramWebLoginController {
  constructor(private readonly webLogin: TelegramWebLoginService) {}

  @AllowAnonymous()
  @Get()
  @ZodResponse({ type: TelegramWidgetDto })
  widget() {
    return this.webLogin.widget();
  }

  @AllowAnonymous()
  @Throttle({ default: WEB_LOGIN.throttle })
  @Post()
  @ZodResponse({ type: TelegramWebLoginDto })
  async redeem(@Body('code') code: string) {
    const token = await this.webLogin.redeem(code);

    return { token };
  }

  @AllowAnonymous()
  @Throttle({ default: WEB_LOGIN.throttle })
  @Post('widget')
  @ZodResponse({ type: TelegramWebLoginDto })
  async signInWithWidget(@Body('idToken') idToken: string) {
    const token = await this.webLogin.signInWithToken(idToken);

    return { token };
  }
}
