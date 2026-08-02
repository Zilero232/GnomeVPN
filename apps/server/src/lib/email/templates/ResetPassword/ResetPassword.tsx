import { Text } from 'react-email';

import type { ResetPasswordProps } from './ResetPassword.types';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

export const ResetPassword = ({ url }: ResetPasswordProps) => (
  <BaseEmail action={{ url, label: 'Задать новый пароль' }} heading='Сброс пароля' preview='Ссылка для сброса пароля GnomeVPN'>
    <Text style={emailStyles.text}>Мы получили запрос на смену пароля. Ссылка действует ограниченное время.</Text>

    <Text style={emailStyles.text}>Если запрос отправляли не вы, проигнорируйте письмо — пароль не изменится.</Text>
  </BaseEmail>
);
