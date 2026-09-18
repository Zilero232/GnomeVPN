import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { describeError } from '../describe-error';

describe('describeError', () => {
  it('returns the string response of an http exception', () => {
    expect(describeError(new HttpException('node unreachable', HttpStatus.BAD_GATEWAY))).toBe('node unreachable');
  });

  it('serializes an object response of an http exception', () => {
    const error = new HttpException({ code: 'NODE_UNAVAILABLE', message: 'down' }, HttpStatus.SERVICE_UNAVAILABLE);

    expect(describeError(error)).toBe('{"code":"NODE_UNAVAILABLE","message":"down"}');
  });

  it('serializes the response nest builds for a shorthand exception', () => {
    expect(describeError(new NotFoundException('missing'))).toBe('{"message":"missing","error":"Not Found","statusCode":404}');
  });

  it('returns the message of a plain error', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
  });

  it('returns the message of a subclassed error', () => {
    expect(describeError(new TypeError('not a function'))).toBe('not a function');
  });

  it('stringifies null', () => {
    expect(describeError(null)).toBe('null');
  });

  it('stringifies undefined', () => {
    expect(describeError(undefined)).toBe('undefined');
  });

  it('stringifies a plain object', () => {
    expect(describeError({ code: 500 })).toBe('[object Object]');
  });

  it('stringifies a primitive', () => {
    expect(describeError(42)).toBe('42');
  });

  it('stringifies an empty string', () => {
    expect(describeError('')).toBe('');
  });
});
