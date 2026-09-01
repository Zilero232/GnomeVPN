import { describe, expect, it } from 'vitest';

import { describeCard } from '../describe-card';

describe('describeCard', () => {
  it('joins the card type with the masked last four digits', () => {
    expect(describeCard({ card: { card_type: 'MasterCard', last4: '4444' } })).toBe('MasterCard •••• 4444');
  });

  it('renders only the masked digits when the card has no type', () => {
    expect(describeCard({ card: { last4: '4444' } })).toBe('•••• 4444');
  });

  it('falls back to the title when there is no card', () => {
    expect(describeCard({ title: 'Основная карта' })).toBe('Основная карта');
  });

  it('returns null when there is neither a card nor a title', () => {
    expect(describeCard({})).toBeNull();
  });

  it('falls back to the title when the card carries no last four digits', () => {
    expect(describeCard({ card: { card_type: 'MasterCard' }, title: 'Основная карта' })).toBe('Основная карта');
  });

  it('returns null when the card carries no last four digits and there is no title', () => {
    expect(describeCard({ card: { card_type: 'MasterCard' } })).toBeNull();
  });

  it('prefers the card over the title', () => {
    expect(describeCard({ card: { card_type: 'Visa', last4: '1111' }, title: 'Основная карта' })).toBe('Visa •••• 1111');
  });
});
