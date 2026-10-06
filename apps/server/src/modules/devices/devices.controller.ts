import { Controller, Delete, Get, HttpCode, Param } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { DeviceIdParamDto, DeviceListDto } from './dto/devices.dto';
import { DevicesService } from './services';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ZodResponse({ type: DeviceListDto })
  list(@CurrentUserId() userId: string) {
    return this.devices.list(userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param() params: DeviceIdParamDto, @CurrentUserId() userId: string) {
    return this.devices.remove({ userId, deviceId: params.id });
  }
}
