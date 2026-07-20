import type { z } from 'zod';
import type {
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateNameSchema,
} from './inputs';

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type UpdateNameValues = z.infer<typeof updateNameSchema>;
export type ChangeEmailValues = z.infer<typeof changeEmailSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
