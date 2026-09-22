export {
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateNameSchema
} from './auth.schemas';

export type {
  ChangeEmailValues,
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
  SignInValues,
  SignUpValues,
  UpdateNameValues
} from './auth.types';

export { isPlaceholderEmail, PLACEHOLDER_EMAIL, telegramPlaceholderEmail } from './placeholder-email';
