const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\LEANDRA\\.gemini\\antigravity\\brain\\dac33282-8133-431c-9ddb-a31fc7fb4d18\\gadgettrustx_logo_1777378546198.png";
const dest = path.join(__dirname, 'public', 'logo.png');

try {
    fs.copyFileSync(src, dest);
    console.log('Logo copied successfully to ' + dest);
} catch (err) {
    console.error('Error copying logo:', err);
}
