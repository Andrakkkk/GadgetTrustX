// Uji beban ringan dengan k6 (https://k6.io). Jalankan: k6 run performance/k6-load.js
// Sengaja kecil (10 user virtual, 30 detik) supaya tidak membebani situs milik orang lain.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% request selesai < 2 detik
    http_req_failed: ['rate<0.01'],     // error < 1%
  },
};

const BASE = __ENV.BASE_URL || 'https://gadgetrustx.netlify.app';

export default function () {
  for (const path of ['/', '/marketplace']) {
    const res = http.get(`${BASE}${path}`);
    check(res, { [`${path} status 200`]: r => r.status === 200 });
  }
  sleep(1);
}
