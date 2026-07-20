import type { CardData } from '../yookassa.types';

export const describeCard = (card?: CardData, title?: string): string | null => {
  if (!card?.last4) {
    return title ?? null;
  }

  return [card.card_type, `•••• ${card.last4}`].filter(Boolean).join(' ');
};
