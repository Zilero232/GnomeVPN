import { isNullish } from 'remeda';

import type { InboundPayloadInput, XrayInboundPayload } from './inbounds.types';

import { INBOUND_REMARK } from './inbounds.constants';

const stringify = (value: unknown) => (isNullish(value) ? '' : JSON.stringify(value));

export const inboundPayload = ({ inbound, remark = INBOUND_REMARK }: InboundPayloadInput): XrayInboundPayload => ({
  ...inbound,
  remark,
  enable: true,
  port: inbound.port as number,
  protocol: inbound.protocol as string,
  settings: JSON.stringify(inbound.settings),
  streamSettings: stringify(inbound.streamSettings),
  sniffing: stringify(inbound.sniffing)
});
