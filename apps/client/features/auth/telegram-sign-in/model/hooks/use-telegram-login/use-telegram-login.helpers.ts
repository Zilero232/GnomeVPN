import type { WidgetScriptInput } from './use-telegram-login.types';

import { TELEGRAM_LOGIN } from './use-telegram-login.constants';

export const widgetScript = ({ botUsername, onError }: WidgetScriptInput): HTMLScriptElement => {
  const script = document.createElement('script');

  script.async = true;
  script.src = TELEGRAM_LOGIN.scriptUrl;

  Object.assign(script.dataset, TELEGRAM_LOGIN.dataset, {
    telegramLogin: botUsername,
    onauth: `${TELEGRAM_LOGIN.callbackName}(user)`
  });

  script.addEventListener('error', onError);

  return script;
};
