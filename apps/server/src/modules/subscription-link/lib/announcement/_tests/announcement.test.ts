import { addDays, subDays, subMinutes } from 'date-fns';
import { describe, expect, it } from 'vitest';

import type { AnnouncementNode } from '../announcement.types';

import { announcement } from '../announcement';
import { ANNOUNCEMENTS, DAY_FORMS, EXPIRY_WARNING_DAYS, FRESH_NODE_DAYS, NODE_STALE_MINUTES } from '../announcement.constants';

const NOW = new Date('2026-06-01T12:00:00.000Z');

const node = (overrides: Partial<AnnouncementNode> = {}): AnnouncementNode => ({
  country: 'Нидерланды',
  createdAt: subDays(NOW, FRESH_NODE_DAYS + 1),
  lastHealthyAt: NOW,
  ...overrides
});

const active = {
  hasSubscription: true,
  currentPeriodEnd: addDays(NOW, EXPIRY_WARNING_DAYS + 30),
  nodes: [node()],
  now: NOW
};

describe('announcement', () => {
  it('says nothing when the subscription is healthy and every node is settled', () => {
    expect(announcement(active)).toBeNull();
  });

  it('speaks up when there is no subscription at all', () => {
    expect(announcement({ ...active, hasSubscription: false, currentPeriodEnd: null })).not.toBeNull();
  });

  it('distinguishes a lapsed subscription from one that was never bought', () => {
    const expired = announcement({ ...active, currentPeriodEnd: subDays(NOW, 1) });

    expect(expired).not.toBeNull();
    expect(expired).not.toBe(announcement({ ...active, hasSubscription: false, currentPeriodEnd: null }));
  });

  it('warns inside the expiry window', () => {
    expect(announcement({ ...active, currentPeriodEnd: addDays(NOW, EXPIRY_WARNING_DAYS) })).not.toBeNull();
  });

  it('stays quiet one day beyond the expiry window', () => {
    expect(announcement({ ...active, currentPeriodEnd: addDays(NOW, EXPIRY_WARNING_DAYS + 1) })).toBeNull();
  });

  it('reports a node whose last healthy probe has gone stale', () => {
    const stale = [node({ lastHealthyAt: subMinutes(NOW, NODE_STALE_MINUTES) })];

    expect(announcement({ ...active, nodes: stale })).toContain('Нидерланды');
  });

  it('treats a node that has never reported as down rather than as new', () => {
    const never = [node({ lastHealthyAt: null })];

    expect(announcement({ ...active, nodes: never })).toContain('Нидерланды');
  });

  it('names a node added inside the fresh window', () => {
    const fresh = [node({ country: 'Германия', createdAt: subDays(NOW, FRESH_NODE_DAYS - 1) })];

    expect(announcement({ ...active, nodes: fresh })).toContain('Германия');
  });

  it('prefers the expiry over anything happening to the nodes', () => {
    const expiring = { ...active, currentPeriodEnd: addDays(NOW, 1), nodes: [node({ lastHealthyAt: null })] };

    expect(announcement(expiring)).not.toContain('Нидерланды');
  });

  it('prefers a node that is down over a node that is new', () => {
    const mixed = [node({ lastHealthyAt: null }), node({ country: 'Германия', createdAt: NOW })];

    expect(announcement({ ...active, nodes: mixed })).not.toContain('Германия');
  });

  it('names each country once, however many nodes it holds', () => {
    const twin = [node({ lastHealthyAt: null }), node({ lastHealthyAt: null })];
    const rendered = announcement({ ...active, nodes: twin }) ?? '';

    expect(rendered.match(/Нидерланды/g)).toHaveLength(1);
  });

  it('joins several countries the way the language does, not with a bare comma', () => {
    const two = [node({ lastHealthyAt: null }), node({ country: 'Германия', lastHealthyAt: null })];

    expect(announcement({ ...active, nodes: two })).toContain('Нидерланды и Германия');
  });

  it('declines the day count, so a single day does not read as a plural', () => {
    const oneDay = announcement({ ...active, currentPeriodEnd: addDays(NOW, 1) });

    expect(oneDay).toBe(ANNOUNCEMENTS.expiringInDays(`1 ${DAY_FORMS.one}`));
  });

  it('declines the day count for the rest of the warning window', () => {
    const threeDays = announcement({ ...active, currentPeriodEnd: addDays(NOW, 3) });

    expect(threeDays).toBe(ANNOUNCEMENTS.expiringInDays(`3 ${DAY_FORMS.few}`));
  });
});
