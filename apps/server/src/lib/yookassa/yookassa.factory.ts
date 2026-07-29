import type { AppConfigService } from '../../config/config.module';

import { YooKassaClient } from './yookassa';

export const makeYooKassaClient = (config: AppConfigService): YooKassaClient =>
  new YooKassaClient({
    shopId: config.get('YOOKASSA_SHOP_ID'),
    secretKey: config.get('YOOKASSA_SECRET_KEY')
  });
