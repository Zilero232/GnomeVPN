import { BUTTON_URL } from './button-url.constants';

const LOCAL_HOSTS: readonly string[] = BUTTON_URL.localHosts;

export const isButtonUrl = (raw: string | null | undefined): raw is string => {
  if (!raw || !URL.canParse(raw)) {
    return false;
  }

  const { protocol, hostname } = new URL(raw);

  return protocol === BUTTON_URL.protocol && !LOCAL_HOSTS.includes(hostname);
};
