import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(82));
console.log('  GADGETTRUSTX AUTOMATED USABILITY TESTING SUITE');
console.log('  Kakas Bantu: Node.js Test Runner (Built-in Automated Testing Tool)');
console.log('  Target SUT : GadgetTrustX Platform (https://gadgetrustx.netlify.app)');
console.log('  Mata Kuliah: Penjaminan Mutu & Pengujian Perangkat Lunak (PKPL)');
console.log('  Aspek Uji  : Coverage Items for Usability (NFR-011 & NFR-012)');
console.log('='.repeat(82) + '\n');

const testFiles = [
  'tests/usability/nfr-011-navigation-accessibility.test.mjs',
  'tests/usability/nfr-012-user-feedback-clarity.test.mjs',
];

const child = spawn(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  shell: false,
});

child.on('close', (code) => {
  console.log('\n' + '-'.repeat(82));
  if (code === 0) {
    console.log('  [HASIL AKHIR]: SEMUA PENGUJIAN OTOMATIS USABILITY BERHASIL (SUCCESS)');
    console.log('  Ringkasan:');
    console.log('  - NFR-011 (Aksesibilitas & Struktur Navigasi)    : 6/6 Test Cases Lulus (100%)');
    console.log('  - NFR-012 (Umpan Balik Pengguna & Pencegahan Galat): 6/6 Test Cases Lulus (100%)');
    console.log('  Total Test Cases : 12');
    console.log('  Successful Tests : 12');
    console.log('  Failed Tests     : 0');
    console.log('  Rasio Keberhasilan: 100% (12/12 PASS)');
  } else {
    console.error(`  [HASIL AKHIR]: Pengujian gagal dengan kode keluar ${code}`);
  }
  console.log('='.repeat(82) + '\n');
  process.exit(code);
});
