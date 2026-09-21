'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { PROTOCOL_IDS, PROTOCOL_ROWS, SERVER_SECTIONS } from '@/entities/app/protocols';
import { blogPostRoute, ROUTES } from '@/shared/constants';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';
import { RelatedLinks } from '@/widgets/site/related-links';

import s from './ServersPage.module.scss';

export const ServersPage = () => {
  const t = useTranslations('servers');

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <motion.header className={s.head} variants={HEAD_MOTION}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </motion.header>

      <motion.section className={s.section} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
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
      </motion.section>

      {SERVER_SECTIONS.map((section) => (
        <motion.section
          key={section}
          className={s.section}
          initial='hidden'
          variants={SECTION_MOTION}
          viewport={REVEAL_VIEWPORT}
          whileInView='visible'
        >
          <Text as='h2' className={s.heading}>
            {t(`sections.${section}.title`)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`sections.${section}.body`)}
          </Text>
        </motion.section>
      ))}

      <RelatedLinks
        links={[
          { href: blogPostRoute('hysteria2-vs-vless'), label: t('related.comparison') },
          { href: blogPostRoute('vpn-not-working-hotel-wifi'), label: t('related.hotel') },
          { href: ROUTES.setup, label: t('related.setup') }
        ]}
      />
    </motion.main>
  );
};
