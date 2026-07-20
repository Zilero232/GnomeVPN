import { YooKassaClient } from './yookassa';

import type { AppConfigService } from '../../config/config.module';

export const makeYooKassaClient = (config: AppConfigService): YooKassaClient =>
  new YooKassaClient({
    shopId: config.get('YOOKASSA_SHOP_ID'),
    secretKey: config.get('YOOKASSA_SECRET_KEY'),
  });
