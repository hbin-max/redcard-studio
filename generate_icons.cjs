// 纯 Node 原生生成 valid PNG 图标 (无外部依赖)
const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit per channel
  ihdr[9] = 2; // RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw Image Data (with filter byte 0 at start of each line)
  const lineLength = 1 + width * 3;
  const rawData = Buffer.alloc(lineLength * height);

  for (let y = 0; y < height; y++) {
    const lineStart = y * lineLength;
    rawData[lineStart] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const px = lineStart + 1 + x * 3;
      // 渐变计算: 从红 (#FF2442) 到玫瑰深红 (#E11D48)
      const factor = (x + y) / (width + height);
      rawData[px] = Math.round(255 * (1 - factor * 0.12)); // R
      rawData[px + 1] = Math.round(36 + factor * 20);      // G
      rawData[px + 2] = Math.round(66 + factor * 10);      // B
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// 快速 CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
    }
  }
  return (crc ^ -1);
}

fs.writeFileSync('./public/icons/icon-192.png', createPng(192, 192, 255, 36, 66));
fs.writeFileSync('./public/icons/icon-512.png', createPng(512, 512, 255, 36, 66));
console.log('✅ PWA 图标已成功生成: icon-192.png, icon-512.png');
