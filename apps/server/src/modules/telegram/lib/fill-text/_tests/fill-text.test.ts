import { describe, expect, it } from 'vitest';

import { TEXT_TOKEN } from '../../../config';
import { fillText } from '../fill-text';

describe('fillText', () => {
  it('replaces the token a caller names, which is the whole job', () => {
    const text = fillText({ text: `until ${TEXT_TOKEN.date}`, fill: { date: '1 January' } });

    expect(text).toBe('until 1 January');
  });

  it('replaces every occurrence, because a token can appear twice in one string', () => {
    const text = fillText({ text: `${TEXT_TOKEN.count} of ${TEXT_TOKEN.count}`, fill: { count: '2' } });

    expect(text).toBe('2 of 2');
  });

  it('leaves a token nobody filled alone rather than blanking it', () => {
    const text = fillText({ text: `${TEXT_TOKEN.date} and ${TEXT_TOKEN.plan}`, fill: { date: 'today' } });

    expect(text).toContain(TEXT_TOKEN.plan);
  });

  it('returns the text unchanged for an empty fill', () => {
    expect(fillText({ text: 'nothing to do', fill: {} })).toBe('nothing to do');
  });
});
