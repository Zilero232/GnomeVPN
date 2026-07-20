import { Text } from 'react-email';

import { BaseEmail } from '../BaseEmail';
import { emailStyles } from '../email-styles';

import type { ResetPasswordProps } from './ResetPassword.types';

export const ResetPassword = ({ url }: ResetPasswordProps) => (
  <BaseEmail
    preview="Ссылка для сброса пароля GnomeVPN"
    heading="Сброс пароля"
    action={{ url, label: 'Задать новый пароль' }}
  >
    <Text style={emailStyles.text}>
      Мы получили запрос на смену пароля. Ссылка действует ограниченное время.
    </Text>

    <Text style={emailStyles.text}>
      Если запрос отправляли не вы, проигнорируйте письмо — пароль не изменится.
    </Text>
  </BaseEmail>
);
