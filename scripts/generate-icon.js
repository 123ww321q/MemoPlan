const fs = require('fs');
const path = require('path');

// 创建一个简单的 16x16 像素的 ICO 文件
// ICO 文件格式：
// 6 bytes header + 16 bytes directory entry + bitmap data

function createIcon() {
  const iconPath = path.join(__dirname, '..', 'src-tauri', 'icons', 'icon.ico');
  
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved, must be 0
  header.writeUInt16LE(1, 2); // Image type: 1 = ICO
  header.writeUInt16LE(1, 4); // Number of images
  
  // ICO Directory Entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);    // Width (32 pixels)
  entry.writeUInt8(32, 1);    // Height (32 pixels)
  entry.writeUInt8(0, 2);     // Number of colors in palette (0 = no palette)
  entry.writeUInt8(0, 3);     // Reserved
  entry.writeUInt16LE(1, 4);  // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(0, 8);  // Size of image data (will update later)
  entry.writeUInt32LE(22, 12); // Offset to image data
  
  // Create a simple 32x32 pixel BMP (XOR mask + AND mask)
  const width = 32;
  const height = 32;
  const bpp = 32;
  const rowSize = Math.ceil((width * bpp) / 32) * 4;
  const imageSize = rowSize * height;
  
  // Bitmap info header (40 bytes)
  const infoHeader = Buffer.alloc(40);
  infoHeader.writeUInt32LE(40, 0);  // Header size
  infoHeader.writeInt32LE(width, 4);   // Width
  infoHeader.writeInt32LE(height * 2, 8); // Height (XOR + AND masks)
  infoHeader.writeUInt16LE(1, 12);  // Planes
  infoHeader.writeUInt16LE(bpp, 14); // Bits per pixel
  infoHeader.writeUInt32LE(0, 16);  // Compression (0 = none)
  infoHeader.writeUInt32LE(0, 20);  // Image size (0 for uncompressed)
  infoHeader.writeInt32LE(0, 24);   // X pixels per meter
  infoHeader.writeInt32LE(0, 28);   // Y pixels per meter
  infoHeader.writeUInt32LE(0, 32);  // Colors in color table
  infoHeader.writeUInt32LE(0, 36);  // Important color count
  
  // XOR mask (pixel data) - create a simple blue square
  const xorMask = Buffer.alloc(imageSize);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (height - 1 - y) * rowSize + x * 4;
      // BGRA format
      xorMask.writeUInt8(255, offset);     // B
      xorMask.writeUInt8(100, offset + 1); // G
      xorMask.writeUInt8(100, offset + 2); // R
      xorMask.writeUInt8(255, offset + 3); // A
    }
  }
  
  // AND mask (1 bit per pixel, no transparency)
  const andMaskSize = Math.ceil(width / 32) * 4 * height;
  const andMask = Buffer.alloc(andMaskSize);
  
  // Combine all parts
  const imageData = Buffer.concat([infoHeader, xorMask, andMask]);
  
  // Update entry with actual size
  entry.writeUInt32LE(imageData.length, 8);
  
  // Final ICO file
  const icoFile = Buffer.concat([header, entry, imageData]);
  
  fs.writeFileSync(iconPath, icoFile);
  console.log(`Icon created at: ${iconPath}`);
}

createIcon();
