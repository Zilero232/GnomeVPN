import type { PageJsonLdProps } from './PageJsonLd.types';

import { breadcrumbJsonLd } from '../breadcrumb-json-ld';
import { JsonLd } from '../JsonLd';

export const PageJsonLd = (props: PageJsonLdProps) => <JsonLd data={breadcrumbJsonLd(props)} />;
