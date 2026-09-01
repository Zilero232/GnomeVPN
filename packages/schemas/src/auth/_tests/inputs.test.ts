import { describe, expect, it } from 'vitest';

import {
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateNameSchema
} from '../inputs';

const firstIssue = (result: { error?: { issues: { message: string; path: PropertyKey[] }[] } }) => result.error?.issues[0];

describe('signInSchema', () => {
  it('accepts a valid pair', () => {
    const result = signInSchema.safeParse({ email: 'user@gnomevpn.ru', password: 'password1' });

    expect(result.success).toBe(true);
  });

  it('trims and lowercases the email', () => {
    const result = signInSchema.parse({ email: '  User@GnomeVPN.RU  ', password: 'password1' });

    expect(result.email).toBe('user@gnomevpn.ru');
  });

  it('rejects an address that is not an email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'password1' });

    expect(firstIssue(result)?.message).toBe('validation.emailInvalid');
  });

  it('rejects a password shorter than eight characters', () => {
    const result = signInSchema.safeParse({ email: 'user@gnomevpn.ru', password: 'short' });

    expect(firstIssue(result)?.message).toBe('validation.passwordMin');
  });
});

describe('signUpSchema', () => {
  const valid = {
    name: 'Alex',
    email: 'user@gnomevpn.ru',
    password: 'password1',
    confirmPassword: 'password1'
  };

  it('accepts a complete form', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('reports a mismatch on the confirmation field', () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: 'password2' });
    const issue = firstIssue(result);

    expect(issue?.message).toBe('validation.passwordsMismatch');
    expect(issue?.path).toEqual(['confirmPassword']);
  });

  it('rejects a name shorter than two characters', () => {
    const result = signUpSchema.safeParse({ ...valid, name: 'A' });

    expect(firstIssue(result)?.message).toBe('validation.nameMin');
  });

  it('rejects a name longer than thirty-two characters', () => {
    const result = signUpSchema.safeParse({ ...valid, name: 'a'.repeat(33) });

    expect(firstIssue(result)?.message).toBe('validation.nameMax');
  });

  it('trims the name before measuring it', () => {
    const result = signUpSchema.parse({ ...valid, name: '  Alex  ' });

    expect(result.name).toBe('Alex');
  });
});

describe('updateNameSchema', () => {
  it('accepts a name inside the bounds', () => {
    expect(updateNameSchema.safeParse({ name: 'Alex' }).success).toBe(true);
  });

  it('rejects a whitespace-only name', () => {
    const result = updateNameSchema.safeParse({ name: '   ' });

    expect(firstIssue(result)?.message).toBe('validation.nameMin');
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@gnomevpn.ru' }).success).toBe(true);
  });

  it('rejects an empty email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts two matching passwords', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'password1', confirmPassword: 'password1' });

    expect(result.success).toBe(true);
  });

  it('reports a mismatch on the confirmation field', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'password1', confirmPassword: 'password2' });
    const issue = firstIssue(result);

    expect(issue?.message).toBe('validation.passwordsMismatch');
    expect(issue?.path).toEqual(['confirmPassword']);
  });

  it('rejects a short new password before comparing it', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' });

    expect(firstIssue(result)?.message).toBe('validation.passwordMin');
  });
});

describe('changeEmailSchema', () => {
  it('lowercases the new address', () => {
    const result = changeEmailSchema.parse({ newEmail: 'New@GnomeVPN.RU' });

    expect(result.newEmail).toBe('new@gnomevpn.ru');
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'password0',
    newPassword: 'password1',
    confirmPassword: 'password1'
  };

  it('accepts a complete form', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('requires the current password', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: '' });

    expect(firstIssue(result)?.message).toBe('validation.required');
  });

  it('does not hold the current password to the new-password length rule', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: 'a' });

    expect(result.success).toBe(true);
  });

  it('reports a mismatch on the confirmation field', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'password2' });

    expect(firstIssue(result)?.path).toEqual(['confirmPassword']);
  });
});
