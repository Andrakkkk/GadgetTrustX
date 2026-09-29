const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgContent = fs.readFileSync(path.join(__dirname, 'public', 'logo-icon.svg'));

sharp(svgContent)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(__dirname, 'public', 'logo.png'))
  .then(() => {
    console.log('SUCCESS: logo.png (Transparent PNG no background) generated!');
  })
  .catch(console.error);
