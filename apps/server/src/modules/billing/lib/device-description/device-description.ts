import { DEVICE_FORMS, EXTRA_DEVICES_PREFIX } from '../../config';
import { pluralize } from '../pluralize';

export const describeExtraDevices = (quantity: number): string =>
  `${EXTRA_DEVICES_PREFIX} ${quantity} ${pluralize({ count: quantity, forms: DEVICE_FORMS })}`;
