import { Text } from 'react-email';

import type { VerifyEmailProps } from './VerifyEmail.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const VerifyEmail = ({ url }: VerifyEmailProps) => (
  <BaseEmail action={{ url, label: 'Confirm email' }} heading='Confirm your email' preview='Confirm your email to finish signing up for GnomeVPN'>
    <Text style={emailStyles.text}>Confirming your address lets us restore access to the account if you ever forget your password.</Text>
  </BaseEmail>
);
