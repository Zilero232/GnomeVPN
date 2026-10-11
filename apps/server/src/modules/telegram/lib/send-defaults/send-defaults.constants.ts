export const SEND_DEFAULTS = {
  formattedMethods: ['sendMessage', 'editMessageText'],
  badRequest: 400,
  unknownEffect: /EFFECT_ID_INVALID/i,
  brokenMarkup: /can't parse entities/i
} as const;
