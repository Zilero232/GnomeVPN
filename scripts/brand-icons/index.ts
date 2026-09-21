import { reporter } from '@gnomevpn/scripts/reporter';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { BACKGROUND, DENSITY, ICON_SIZES, SOURCE_ICON } from './brand-icons.constants';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BRAND_DIR = resolve(ROOT, 'apps', 'client', 'public', 'brand');

const log = reporter('brand-icons');

// Google wants a raster for Organization.logo and an installable manifest needs
// 192 and 512 PNGs; the brand mark only exists as SVG, so they are rendered
// from it rather than kept as separate files nobody remembers to update.
const render = async () => {
  const source = readFileSync(resolve(BRAND_DIR, SOURCE_ICON));

  for (const { size, name } of ICON_SIZES) {
    await sharp(source, { density: DENSITY }).resize(size, size, { fit: 'contain', background: BACKGROUND }).png().toFile(resolve(BRAND_DIR, name));

    log.info(`${name} — ${size}×${size}`);
  }
};

await render();
