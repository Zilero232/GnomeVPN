import { Text } from 'react-email';

import type { ResetPasswordProps } from './ResetPassword.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const ResetPassword = ({ url }: ResetPasswordProps) => (
  <BaseEmail action={{ url, label: 'Set a new password' }} heading='Password reset' preview='Your GnomeVPN password reset link'>
    <Text style={emailStyles.text}>We received a request to change your password. This link is valid for a limited time.</Text>

    <Text style={emailStyles.text}>If you did not ask for this, ignore the email — your password stays as it is.</Text>
  </BaseEmail>
);
