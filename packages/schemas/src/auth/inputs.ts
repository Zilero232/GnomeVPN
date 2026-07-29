import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('validation.emailInvalid'));
const passwordSchema = z.string().min(8, 'validation.passwordMin');
const nameSchema = z.string().trim().min(2, 'validation.nameMin').max(32, 'validation.nameMax');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword']
  });

export const updateNameSchema = z.object({
  name: nameSchema
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword']
  });

export const changeEmailSchema = z.object({
  newEmail: emailSchema
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.required'),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword']
  });
