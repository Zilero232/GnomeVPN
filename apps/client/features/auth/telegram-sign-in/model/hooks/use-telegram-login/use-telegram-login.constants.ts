export const TELEGRAM_LOGIN = {
  scriptUrl: 'https://telegram.org/js/telegram-widget.js?22',
  callbackName: 'onTelegramAuth',
  dataset: {
    size: 'large',
    radius: '12',
    requestAccess: 'write'
  }
} as const;
