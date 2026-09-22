import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';

import { CurrentUserId } from '../../common/decorators';
import { AccountService } from './services';

@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUserId() userId: string) {
    return this.account.remove(userId);
  }
}
