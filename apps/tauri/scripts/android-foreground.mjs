import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', '..', 'client', 'public', 'brand', 'logo-mark-foreground.svg');
const android = join(here, '..', 'icons', 'android');

const SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const SAFE_ZONE = 0.6;

const svg = readFileSync(source);

const render = async (size) => {
  const inner = Math.round(size * SAFE_ZONE);
  const offset = Math.round((size - inner) / 2);

  const mark = await sharp(svg, { density: 512 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, top: offset, left: offset }])
    .png()
    .toBuffer();
};

const written = [];

for (const [folder, size] of Object.entries(SIZES)) {
  const png = await render(size);
  const target = join(android, folder, 'ic_launcher_foreground.png');

  writeFileSync(target, png);
  written.push(`${folder} (${size}px)`);
}

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log(`[android] adaptive foreground: ${written.join(', ')}`);
