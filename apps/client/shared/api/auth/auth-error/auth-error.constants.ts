export const AUTH_ERROR_KEY = {
  USER_ALREADY_EXISTS: 'errors.emailTaken',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'errors.emailTaken',
  INVALID_EMAIL_OR_PASSWORD: 'errors.invalidCredentials',
  INVALID_PASSWORD: 'errors.invalidCredentials',
  INVALID_EMAIL: 'errors.invalidEmail',
  EMAIL_NOT_VERIFIED: 'errors.emailNotVerified',
  PASSWORD_TOO_SHORT: 'errors.passwordTooShort',
  PASSWORD_TOO_LONG: 'errors.passwordTooLong',
  USER_NOT_FOUND: 'errors.userNotFound',
  SESSION_EXPIRED: 'errors.sessionExpired',
  FAILED_TO_CREATE_USER: 'errors.signUpFailed',
  FAILED_TO_CREATE_SESSION: 'errors.signInFailed'
} as const;
