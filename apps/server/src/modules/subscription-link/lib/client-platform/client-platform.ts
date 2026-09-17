import { INCY_USER_AGENT, MAX_AGENT_LENGTH } from './client-platform.constants';

export const clientPlatform = (userAgent: string | null): string | null => {
  if (!userAgent) {
    return null;
  }

  const parsed = INCY_USER_AGENT.exec(userAgent.trim());

  if (!parsed) {
    return userAgent.slice(0, MAX_AGENT_LENGTH);
  }

  const [, version, platform] = parsed;

  return `INCY ${platform} ${version}`;
};
