import type { DescribeCardInput } from './describe-card.types';

export const describeCard = ({ card, title }: DescribeCardInput): string | null => {
  if (!card?.last4) {
    return title ?? null;
  }

  return [card.card_type, `•••• ${card.last4}`].filter(Boolean).join(' ');
};
