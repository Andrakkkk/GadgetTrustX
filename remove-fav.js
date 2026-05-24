const fs = require('fs');
const path = require('path');

const favPath = path.join(__dirname, 'src', 'app', 'favicon.ico');
const newPath = path.join(__dirname, 'src', 'app', 'favicon.ico.bak');

if (fs.existsSync(favPath)) {
    fs.renameSync(favPath, newPath);
    console.log('Renamed existing favicon to .bak');
} else {
    console.log('No favicon.ico found in src/app');
}
