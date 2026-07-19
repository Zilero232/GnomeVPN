import { SITE } from '@/shared/config';
import { createPageMetadata } from '@/shared/seo';
import { LandingPage } from '@/views/landing';

export const metadata = createPageMetadata({
  title: SITE.title,
  description: SITE.description,
  path: '/',
});

const Page = () => <LandingPage />;

export default Page;
