import { getTranslations } from 'next-intl/server';
import { ImageResponse } from 'next/og';
import * as rootParams from 'next/root-params';

import { SITE } from '@/shared/config';
import { resolveLocale } from '@/shared/i18n';

import { OG_SIZE } from './opengraph-image.constants';

export const alt = SITE.name;
export const size = OG_SIZE;
export const contentType = 'image/png';

const Image = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'common' });

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: SITE.themeColor.dark,
        color: '#f2f5f4'
      }}
    >
      <div style={{ fontSize: 34, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3ddc91' }}>{SITE.name}</div>

      <div style={{ marginTop: 28, fontSize: 68, lineHeight: 1.1, fontWeight: 700 }}>{t('ogTitle')}</div>

      <div style={{ marginTop: 26, fontSize: 32, lineHeight: 1.4, color: '#9fb0aa' }}>{t('ogDescription')}</div>
    </div>,
    size
  );
};

export default Image;
