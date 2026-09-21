import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AppBadRequestException, AppNotFoundException } from '../../../exceptions';
import { errorCodeOf } from '../error-code';

describe('errorCodeOf', () => {
  it('reads the code back out of an app exception', () => {
    expect(errorCodeOf(new AppBadRequestException('TELEGRAM_CODE_INVALID', 'nope'))).toBe('TELEGRAM_CODE_INVALID');
    expect(errorCodeOf(new AppNotFoundException('NOT_FOUND', 'nope'))).toBe('NOT_FOUND');
  });

  it('returns null for an http exception carrying no code', () => {
    expect(errorCodeOf(new HttpException('plain', HttpStatus.BAD_REQUEST))).toBeNull();
  });

  it('returns null for a body whose code is not one we publish', () => {
    expect(errorCodeOf(new HttpException({ error: 'nope', code: 'MADE_UP' }, HttpStatus.BAD_REQUEST))).toBeNull();
  });

  it('returns null for anything that is not an http exception', () => {
    expect(errorCodeOf(new Error('boom'))).toBeNull();
    expect(errorCodeOf('boom')).toBeNull();
    expect(errorCodeOf(null)).toBeNull();
    expect(errorCodeOf(undefined)).toBeNull();
  });
});
