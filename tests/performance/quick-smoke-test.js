import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

const devicesLatency = new Trend('latency_ci01_devices');
const deviceDetailLatency = new Trend('latency_ci02_device_detail');
const imeiCheckLatency = new Trend('latency_ci03_imei_check');
const priceCheckerLatency = new Trend('latency_ci04_price_checker');

export const options = {
  vus: 5,            // 5 Virtual Users simultan
  duration: '10s',   // Uji coba singkat 10 detik
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('CI-01: Katalog Perangkat', () => {
    const res = http.get(`${BASE_URL}/api/devices`);
    check(res, {
      'CI-01 Status 200': (r) => r.status === 200,
    });
    devicesLatency.add(res.timings.duration);
  });

  sleep(0.3);

  group('CI-02: Detail Perangkat', () => {
    const res = http.get(`${BASE_URL}/api/devices/dev1`);
    check(res, {
      'CI-02 Status 200': (r) => r.status === 200,
    });
    deviceDetailLatency.add(res.timings.duration);
  });

  sleep(0.3);

  group('CI-03: Verifikasi IMEI', () => {
    const res = http.post(
      `${BASE_URL}/api/imei-check`,
      JSON.stringify({ imei: '354285123456789' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, {
      'CI-03 Status 200': (r) => r.status === 200,
      'CI-03 VERIFIED': (r) => JSON.parse(r.body).status === 'VERIFIED',
    });
    imeiCheckLatency.add(res.timings.duration);
  });

  sleep(0.3);

  group('CI-04: AI Price Checker (Cached)', () => {
    const res = http.post(
      `${BASE_URL}/api/price-checker`,
      JSON.stringify({
        device: 'Galaxy S23 Ultra',
        brand: 'Samsung',
        condition: 'Good',
        storage: '256GB',
        ram: '8GB',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, {
      'CI-04 Status 200': (r) => r.status === 200,
    });
    priceCheckerLatency.add(res.timings.duration);
  });

  sleep(0.5);
}
