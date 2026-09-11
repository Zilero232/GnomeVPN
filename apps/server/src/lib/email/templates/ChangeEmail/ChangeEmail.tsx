import { Text } from 'react-email';

import type { ChangeEmailProps } from './ChangeEmail.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const ChangeEmail = ({ url, newEmail }: ChangeEmailProps) => (
  <BaseEmail action={{ url, label: 'Confirm the change' }} heading='Email change' preview='Confirm your new GnomeVPN email address'>
    <Text style={emailStyles.text}>
      You asked to change your address to <strong>{newEmail}</strong>. Confirm it to sign in with the new one from now on.
    </Text>

    <Text style={emailStyles.text}>If this was not you, ignore the email — your address stays as it is.</Text>
  </BaseEmail>
);
