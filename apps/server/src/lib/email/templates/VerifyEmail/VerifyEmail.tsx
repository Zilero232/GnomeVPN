import { Text } from 'react-email';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

import type { VerifyEmailProps } from './VerifyEmail.types';

export const VerifyEmail = ({ url }: VerifyEmailProps) => (
  <BaseEmail
    preview="Подтвердите почту, чтобы завершить регистрацию в GnomeVPN"
    heading="Подтвердите почту"
    action={{ url, label: 'Подтвердить почту' }}
  >
    <Text style={emailStyles.text}>
      Подтвердите адрес, чтобы мы могли восстановить доступ к аккаунту, если вы забудете пароль.
    </Text>
  </BaseEmail>
);
