import type { NextConfig } from 'next';

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const IMAGES: NextConfig['images'] = {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: WEEK_IN_SECONDS
};

export const OPTIMIZED_PACKAGES = ['lucide-react', 'remeda', 'date-fns'];
