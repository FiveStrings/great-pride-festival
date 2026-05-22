import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const GALLERY_DIR   = './images/2025';
const OUTPUT_DIR    = './images/2025/optimized';
const SINGLES = [
  { src: './images/flyer.png',                        dest: './images/flyer.webp',                        maxWidth: 1400 },
  { src: './images/ac-pride-logo.png',                dest: './images/ac-pride-logo.webp',                maxWidth: 400  },
  { src: './images/AC-Pride-logo-with-pink-outline.png', dest: './images/AC-Pride-logo-with-pink-outline.webp', maxWidth: 400 },
  { src: './images/AC-Pride-circle-logo.png',         dest: './images/AC-Pride-circle-logo.webp',         maxWidth: 400  },
  { src: './images/great-pride-logo.png',             dest: './images/great-pride-logo.webp',             maxWidth: 600  },
];

const GALLERY_MAX_WIDTH = 1600; // large enough for lightbox, much smaller than originals
const WEBP_QUALITY      = 82;

function kb(bytes) { return (bytes / 1024).toFixed(1) + ' KB'; }

async function processGallery() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await readdir(GALLERY_DIR))
    .filter(f => /\.(jpe?g|png)$/i.test(f));

  console.log(`\nGallery images → ${OUTPUT_DIR}\n`);

  for (const file of files) {
    const src  = join(GALLERY_DIR, file);
    const dest = join(OUTPUT_DIR, basename(file, extname(file)) + '.webp');

    const before = (await stat(src)).size;
    await sharp(src)
      .resize({ width: GALLERY_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(dest);
    const after = (await stat(dest)).size;

    const pct = Math.round((1 - after / before) * 100);
    console.log(`  ${file.padEnd(35)} ${kb(before).padStart(10)}  →  ${kb(after).padStart(10)}  (${pct}% smaller)`);
  }
}

async function processSingles() {
  console.log(`\nSingle images\n`);

  for (const { src, dest, maxWidth } of SINGLES) {
    try {
      const before = (await stat(src)).size;
      await sharp(src)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(dest);
      const after = (await stat(dest)).size;

      const pct = Math.round((1 - after / before) * 100);
      console.log(`  ${basename(src).padEnd(45)} ${kb(before).padStart(10)}  →  ${kb(after).padStart(10)}  (${pct}% smaller)`);
    } catch {
      console.warn(`  SKIPPED (not found): ${src}`);
    }
  }
}

(async () => {
  await processGallery();
  await processSingles();
  console.log('\nDone. Update your HTML src paths to point to the .webp files.\n');
  console.log('Gallery images are in: images/2025/optimized/');
})();
