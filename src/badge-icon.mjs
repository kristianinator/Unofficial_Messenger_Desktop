import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

const GLYPHS = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  "+": ["000", "010", "111", "010", "000"]
};

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1
      ? 0xedb88320 ^ (value >>> 1)
      : value >>> 1;
  }

  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);

  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);

  return chunk;
}

function setPixel(pixels, size, x, y, red, green, blue, alpha = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;

  const offset = (y * size + x) * 4;
  pixels[offset] = red;
  pixels[offset + 1] = green;
  pixels[offset + 2] = blue;
  pixels[offset + 3] = alpha;
}

function drawText(pixels, size, text) {
  const glyphWidth = 3;
  const glyphHeight = 5;
  const gap = 1;
  const widthInUnits = text.length * glyphWidth + (text.length - 1) * gap;
  const scale = Math.max(
    1,
    Math.floor(Math.min((size * 0.72) / widthInUnits, (size * 0.5) / glyphHeight))
  );
  const textWidth = widthInUnits * scale;
  const textHeight = glyphHeight * scale;
  const startX = Math.floor((size - textWidth) / 2);
  const startY = Math.floor((size - textHeight) / 2);

  for (let characterIndex = 0; characterIndex < text.length; characterIndex += 1) {
    const glyph = GLYPHS[text[characterIndex]];
    const characterX = startX + characterIndex * (glyphWidth + gap) * scale;

    for (let row = 0; row < glyphHeight; row += 1) {
      for (let column = 0; column < glyphWidth; column += 1) {
        if (glyph[row][column] !== "1") continue;

        for (let offsetY = 0; offsetY < scale; offsetY += 1) {
          for (let offsetX = 0; offsetX < scale; offsetX += 1) {
            setPixel(
              pixels,
              size,
              characterX + column * scale + offsetX,
              startY + row * scale + offsetY,
              255,
              255,
              255
            );
          }
        }
      }
    }
  }
}

export function createBadgePng(count, size = 32) {
  const normalizedCount = Math.max(0, Math.floor(Number(count) || 0));
  const text = normalizedCount > 99 ? "99+" : String(normalizedCount);
  const pixels = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x + 0.5 - center, y + 0.5 - center);
      const alpha = Math.max(
        0,
        Math.min(255, Math.round((radius + 0.5 - distance) * 255))
      );

      if (alpha > 0) setPixel(pixels, size, x, y, 229, 57, 53, alpha);
    }
  }

  drawText(pixels, size, text);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const scanlineOffset = y * (size * 4 + 1);
    scanlines[scanlineOffset] = 0;
    pixels.copy(
      scanlines,
      scanlineOffset + 1,
      y * size * 4,
      (y + 1) * size * 4
    );
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    createChunk("IHDR", header),
    createChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    createChunk("IEND")
  ]);
}
