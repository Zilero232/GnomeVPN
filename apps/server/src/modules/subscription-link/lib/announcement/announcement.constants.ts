export const EXPIRY_WARNING_DAYS = 3;

export const NODE_STALE_MINUTES = 10;

export const FRESH_NODE_DAYS = 7;

export const ANNOUNCE_LOCALE = 'ru-RU';

export const DAY_FORMS: Record<Intl.LDMLPluralRule, string> = {
  one: 'день',
  few: 'дня',
  many: 'дней',
  other: 'дня',
  two: 'дня',
  zero: 'дней'
};

export const ANNOUNCEMENTS = {
  noSubscription: 'Подписка не оформлена — серверы недоступны. Оформите её в личном кабинете.',
  expired: 'Подписка истекла — серверы недоступны. Продлите её в личном кабинете.',
  expiringToday: 'Подписка заканчивается сегодня. Продлите её, чтобы не потерять доступ.',
  expiringInDays: (left: string) => `Подписка заканчивается через ${left}. Продлите её, чтобы не потерять доступ.`,
  nodesDown: (countries: string) => `Временно недоступны: ${countries}. Выберите другой сервер в списке.`,
  freshNodes: (countries: string) => `Новые серверы: ${countries}.`
} as const;
