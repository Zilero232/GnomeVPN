import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Неверный email'));
const passwordSchema = z.string().min(8, 'Минимум 8 символов');
const nameSchema = z.string().trim().min(2, 'Минимум 2 символа').max(32, 'Максимум 32 символа');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
