import { BlockList, isIPv4, isIPv6 } from 'node:net';

import { WEBHOOK_ALLOWED_CIDRS } from '../config';

const buildBlockList = (): BlockList => {
  const list = new BlockList();

  for (const cidr of WEBHOOK_ALLOWED_CIDRS) {
    const [address, prefix] = cidr.split('/');
    const type = isIPv6(address) ? 'ipv6' : 'ipv4';

    list.addSubnet(address, Number(prefix), type);
  }

  return list;
};

const allowed = buildBlockList();

export const isAllowedWebhookIp = (raw: string): boolean => {
  const ip = raw.replace('::ffff:', '');

  if (!isIPv4(ip) && !isIPv6(ip)) {
    return false;
  }

  return allowed.check(ip, isIPv6(ip) ? 'ipv6' : 'ipv4');
};
