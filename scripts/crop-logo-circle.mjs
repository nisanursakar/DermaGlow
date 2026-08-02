import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src/assets/images/logo.png');
const out = path.join(root, 'src/assets/images/logo-circle.png');

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

// 1) Portre tuvalden merkez kare çıkar
const square = Math.min(w, h);
const squareLeft = Math.round((w - square) / 2);
const squareTop = Math.round((h - square) / 2);

// 2) Kare içinden yalnızca dairesel amblem (ışınlar hariç)
const innerRatio = 0.56;
const inner = Math.round(square * innerRatio);
const innerLeft = squareLeft + Math.round((square - inner) / 2);
const innerTop = squareTop + Math.round((square - inner) / 2);

const circleMask = Buffer.from(
  `<svg width="512" height="512"><circle cx="256" cy="256" r="254" fill="white"/></svg>`,
);

await sharp(src)
  .extract({ left: innerLeft, top: innerTop, width: inner, height: inner })
  .resize(512, 512, { fit: 'contain', background: { r: 255, g: 253, b: 247, alpha: 1 } })
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .flatten({ background: { r: 255, g: 253, b: 247 } })
  .png()
  .toFile(out);

console.log('Created:', out, { w, h, square, inner, innerLeft, innerTop });
