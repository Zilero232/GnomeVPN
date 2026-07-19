import { describe, expect, it } from 'vitest';

import { signInSchema, signUpSchema } from '../inputs';

describe('signInSchema', () => {
  it('приводит email к нижнему регистру и обрезает пробелы', () => {
    const parsed = signInSchema.parse({ email: '  ME@Test.LOCAL ', password: 'password123' });

    expect(parsed.email).toBe('me@test.local');
  });

  it('отклоняет пароль короче 8 символов', () => {
    const result = signInSchema.safeParse({ email: 'me@test.local', password: 'short' });

    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('отклоняет несовпадающие пароли', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(result.success).toBe(false);
  });

  it('привязывает ошибку несовпадения к полю confirmPassword', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });

  it('принимает валидные данные', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
  });
});
