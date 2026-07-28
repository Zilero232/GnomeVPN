import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';

import { HYSTERIA2_FILE_EXTENSION, WIREGUARD_FILE_EXTENSION } from '../../config';
import { configFileName, renderHysteria2Config } from '../config-file';
import { renderWireguardConfigFile } from '../wg-config-file';

import type { RenderConfigInput, RenderedConfig } from './render-config.types';

export const renderConfig = ({
  config,
  protocol,
  country,
  deviceName,
}: RenderConfigInput): RenderedConfig => {
  const baseName = configFileName({ country, deviceName });

  if (protocol === TUNNEL_PROTOCOL.wireguard) {
    return {
      fileName: `${baseName}.${WIREGUARD_FILE_EXTENSION}`,
      content: renderWireguardConfigFile({ config }),
    };
  }

  return {
    fileName: `${baseName}.${HYSTERIA2_FILE_EXTENSION}`,
    content: renderHysteria2Config({ config, deviceName, country }),
  };
};
