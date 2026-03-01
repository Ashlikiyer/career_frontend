// PWA Icon Generator Script
// Run this with: node scripts/generate-pwa-icons.js
// Requires: npm install sharp

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [192, 512];
const inputPath = path.join(__dirname, '../public/pathfinder-logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `pwa-${size}x${size}.png`);
    
    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: pwa-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }
  
  console.log('\n🎉 PWA icons generated successfully!');
}

generateIcons();
