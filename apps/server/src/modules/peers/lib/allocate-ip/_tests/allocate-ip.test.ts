import { describe, expect, it } from 'vitest';

import { nextWireguardIp } from '../allocate-ip';

const SUBNET = '10.9.0.0/24';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => `10.9.0.${from + index}`);

describe('nextWireguardIp', () => {
  it('hands out the first host when nothing is taken', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: [] })).toBe('10.9.0.2');
  });

  it('skips the server address at the host offset', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: [] })).not.toBe('10.9.0.1');
  });

  it('returns the next free host after a contiguous block', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: ['10.9.0.2', '10.9.0.3', '10.9.0.4'] })).toBe('10.9.0.5');
  });

  it('fills a gap in a fragmented list', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: ['10.9.0.2', '10.9.0.4', '10.9.0.5'] })).toBe('10.9.0.3');
  });

  it('ignores duplicates in the taken list', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: ['10.9.0.2', '10.9.0.2', '10.9.0.3'] })).toBe('10.9.0.4');
  });

  it('ignores addresses outside the allocation range', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: ['10.9.0.1', '10.9.0.255'] })).toBe('10.9.0.2');
  });

  it('returns the last host when everything else is taken', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: range(2, 253) })).toBe('10.9.0.254');
  });

  it('returns null when the subnet is full', () => {
    expect(nextWireguardIp({ subnet: SUBNET, taken: range(2, 254) })).toBeNull();
  });

  it('derives the prefix from the given subnet', () => {
    expect(nextWireguardIp({ subnet: '192.168.77.0/24', taken: [] })).toBe('192.168.77.2');
  });
});
