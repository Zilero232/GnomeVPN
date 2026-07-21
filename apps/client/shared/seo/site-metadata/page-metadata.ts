import { SITE } from '@/shared/config';

import type { Metadata } from 'next';
import type { PageMetadataInput } from './page-metadata.types';

export const createPageMetadata = ({
  title,
  description,
  path,
  index = false,
  follow = false,
}: PageMetadataInput): Metadata => {
  const ogTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  const images = [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }];

  return {
    title,
    description,
    ...(index ? { alternates: { canonical: path } } : {}),
    robots: { index, follow },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      type: 'website',
      images,
    },
    twitter: {
      title: ogTitle,
      description,
      images: [SITE.ogImage],
    },
  };
};
