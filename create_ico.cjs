const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, 'public/icons/icon-192.png');
const icoPath = path.join(__dirname, 'app.ico');

if (fs.existsSync(pngPath)) {
  const pngBuffer = fs.readFileSync(pngPath);
  
  // ICO header for 1 PNG image
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Count: 1
  
  // Directory entry
  header.writeUInt8(192, 6); // Width (0 for 256, 192 fits in 1 byte)
  header.writeUInt8(192, 7); // Height
  header.writeUInt8(0, 8);   // Color palette
  header.writeUInt8(0, 9);   // Reserved
  header.writeUInt16LE(1, 10); // Color planes
  header.writeUInt16LE(32, 12); // Bits per pixel
  header.writeUInt32LE(pngBuffer.length, 14); // Image size in bytes
  header.writeUInt32LE(22, 18); // Offset of image data
  
  const icoBuffer = Buffer.concat([header, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Successfully created app.ico! Size:', icoBuffer.length);
} else {
  console.error('PNG not found at', pngPath);
}
