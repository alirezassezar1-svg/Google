import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Create a minimal valid PNG with specified dimensions and gradient background + N symbol
function createPng(width, height, isMaskable = false) {
  // We construct raw uncompressed RGBA scanlines: (1 byte filter type 0) + (width * 4 bytes) per row
  const rowSize = 1 + width * 4;
  const rawBuffer = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawBuffer[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Normalized coordinates [0, 1]
      const nx = x / width;
      const ny = y / height;

      // Background color: deep futuristic space (#0a0d16 -> #05070a)
      let r = Math.floor(10 - ny * 5);
      let g = Math.floor(13 - ny * 6);
      let b = Math.floor(22 - ny * 12);
      let a = 255;

      // Safe zone & rounded corner distance for non-maskable
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;

      // Outer border circle or square glow
      const distFromCenter = Math.sqrt(dx * dx + dy * dy) / (width / 2);

      if (distFromCenter < 0.95) {
        // Subtle futuristic cyan glow
        const glow = Math.max(0, 1 - Math.abs(distFromCenter - 0.7) * 4);
        r = Math.min(255, r + Math.floor(glow * 20));
        g = Math.min(255, g + Math.floor(glow * 60));
        b = Math.min(255, b + Math.floor(glow * 100));
      }

      // Draw stylized 'N' logo in the center (from nx 0.28 to 0.72, ny 0.26 to 0.74)
      const inLogoBox = nx >= 0.28 && nx <= 0.72 && ny >= 0.26 && ny <= 0.74;
      if (inLogoBox) {
        // Left bar: nx between 0.29 and 0.39
        const isLeftBar = nx >= 0.29 && nx <= 0.39;
        // Right bar: nx between 0.61 and 0.71
        const isRightBar = nx >= 0.61 && nx <= 0.71;
        // Diagonal: line from (0.35, 0.26) to (0.65, 0.74) with thickness
        const t = (ny - 0.26) / (0.74 - 0.26);
        const diagX = 0.35 + t * 0.30;
        const isDiag = Math.abs(nx - diagX) <= 0.055;

        if (isLeftBar || isRightBar || isDiag) {
          // Gradient from cyan (#00f2fe) to purple (#7f00ff)
          const grad = ny;
          r = Math.floor(0 * (1 - grad) + 127 * grad);
          g = Math.floor(242 * (1 - grad) + 0 * grad);
          b = Math.floor(254 * (1 - grad) + 255 * grad);
        }
      }

      rawBuffer[pxOffset] = r;
      rawBuffer[pxOffset + 1] = g;
      rawBuffer[pxOffset + 2] = b;
      rawBuffer[pxOffset + 3] = a;
    }
  }

  // Compress IDAT payload with zlib
  const compressedData = zlib.deflateSync(rawBuffer);

  // Helper to create chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = crc32(toCrc);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 table
  function crc32(buf) {
    let table = crc32.table;
    if (!table) {
      table = crc32.table = new Int32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
      }
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate files
const icons = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon.ico', size: 64, maskable: false },
];

for (const icon of icons) {
  const buf = createPng(icon.size, icon.size, icon.maskable);
  const targetPath = path.join(publicDir, icon.name);
  fs.writeFileSync(targetPath, buf);
  console.log(`Generated ${icon.name} (${buf.length} bytes)`);
}
