import { Text } from 'react-email';

import type { ChangeEmailProps } from './ChangeEmail.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const ChangeEmail = ({ url, newEmail }: ChangeEmailProps) => (
  <BaseEmail action={{ url, label: 'Подтвердить смену' }} heading='Смена почты' preview='Подтвердите смену почты в GnomeVPN'>
    <Text style={emailStyles.text}>
      Вы запросили смену адреса на <strong>{newEmail}</strong>. Подтвердите её, чтобы вход выполнялся по новому адресу.
    </Text>

    <Text style={emailStyles.text}>Если это были не вы, просто проигнорируйте письмо — адрес останется прежним.</Text>
  </BaseEmail>
);
