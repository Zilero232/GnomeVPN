import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from 'react-email';

import type { BaseEmailProps } from './BaseEmail.types';

import { emailStyles } from '../email-styles';

export const BaseEmail = ({ preview, heading, action, children }: BaseEmailProps) => (
  <Html lang='ru'>
    <Head />
    <Preview>{preview}</Preview>

    <Body style={emailStyles.body}>
      <Container style={emailStyles.outer}>
        <Section style={emailStyles.card}>
          <Text style={emailStyles.brand}>GnomeVPN</Text>
          <Heading style={emailStyles.heading}>{heading}</Heading>

          {children}

          {action ? (
            <>
              <Section style={{ paddingTop: '18px' }}>
                <Button href={action.url} style={emailStyles.button}>
                  {action.label}
                </Button>
              </Section>

              <Hr style={emailStyles.hr} />

              <Text style={emailStyles.footnote}>
                Если кнопка не работает, скопируйте ссылку в браузер:{' '}
                <Link href={action.url} style={emailStyles.link}>
                  {action.url}
                </Link>
              </Text>
            </>
          ) : null}
        </Section>
      </Container>
    </Body>
  </Html>
);
