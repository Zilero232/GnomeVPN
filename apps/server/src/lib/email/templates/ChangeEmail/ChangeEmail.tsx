import { Text } from 'react-email';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

import type { ChangeEmailProps } from './ChangeEmail.types';

export const ChangeEmail = ({ url, newEmail }: ChangeEmailProps) => (
  <BaseEmail
    preview="Подтвердите смену почты в GnomeVPN"
    heading="Смена почты"
    action={{ url, label: 'Подтвердить смену' }}
  >
    <Text style={emailStyles.text}>
      Вы запросили смену адреса на <strong>{newEmail}</strong>. Подтвердите её, чтобы вход
      выполнялся по новому адресу.
    </Text>

    <Text style={emailStyles.text}>
      Если это были не вы, просто проигнорируйте письмо — адрес останется прежним.
    </Text>
  </BaseEmail>
);
