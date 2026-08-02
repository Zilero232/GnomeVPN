import { Text } from 'react-email';

import type { VerifyEmailProps } from './VerifyEmail.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const VerifyEmail = ({ url }: VerifyEmailProps) => (
  <BaseEmail
    action={{ url, label: 'Подтвердить почту' }}
    heading='Подтвердите почту'
    preview='Подтвердите почту, чтобы завершить регистрацию в GnomeVPN'
  >
    <Text style={emailStyles.text}>Подтвердите адрес, чтобы мы могли восстановить доступ к аккаунту, если вы забудете пароль.</Text>
  </BaseEmail>
);
