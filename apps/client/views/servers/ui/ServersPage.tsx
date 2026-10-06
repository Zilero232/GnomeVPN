import { useTranslations } from 'next-intl';

import { PROTOCOL_IDS, PROTOCOL_ROWS, SERVER_SECTIONS } from '@/entities/app/protocols';
import { blogPostRoute, ROUTES } from '@/shared/constants';
import { Text } from '@/ui-kit';
import { RelatedLinks } from '@/widgets/site/related-links';

import s from './ServersPage.module.scss';

export const ServersPage = () => {
  const t = useTranslations('servers');

  return (
    <main className={s.root}>
      <header className={s.head}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </header>

      <section className={s.section}>
        <Text as='h2' className={s.heading}>
          {t('tableTitle')}
        </Text>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope='col'>{t('rows.label')}</th>

                {PROTOCOL_IDS.map((protocol) => (
                  <th key={protocol} scope='col'>
                    {t(`protocols.${protocol}.name`)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PROTOCOL_ROWS.map((row) => (
                <tr key={row}>
                  <th scope='row'>{t(`rows.${row}`)}</th>

                  {PROTOCOL_IDS.map((protocol) => (
                    <td key={protocol}>{t(`protocols.${protocol}.${row}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {SERVER_SECTIONS.map((section) => (
        <section key={section} className={s.section}>
          <Text as='h2' className={s.heading}>
            {t(`sections.${section}.title`)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`sections.${section}.body`)}
          </Text>
        </section>
      ))}

      <RelatedLinks
        links={[
          { href: blogPostRoute('hysteria2-vs-vless'), label: t('related.comparison') },
          { href: blogPostRoute('vpn-not-working-hotel-wifi'), label: t('related.hotel') },
          { href: ROUTES.setup, label: t('related.setup') }
        ]}
      />
    </main>
  );
};
