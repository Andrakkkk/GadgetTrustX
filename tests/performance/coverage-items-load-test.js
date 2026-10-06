import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom Metrics per Coverage Item
const devicesLatency = new Trend('latency_ci01_devices');
const deviceDetailLatency = new Trend('latency_ci02_device_detail');
const imeiCheckLatency = new Trend('latency_ci03_imei_check');
const priceCheckerLatency = new Trend('latency_ci04_price_checker');
const errorRate = new Rate('coverage_error_rate');
const successfulRequests = new Counter('coverage_successful_requests');

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp-up: 0 ke 10 Virtual Users
    { duration: '20s', target: 25 }, // Steady State Load: 25 Virtual Users
    { duration: '10s', target: 50 }, // Spike Load: Lonjakan ke 50 Virtual Users
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    // Global Thresholds (Batas Lulus Pengujian)
    http_req_duration: ['p(95)<800'], // 95% request harus di bawah 800ms
    coverage_error_rate: ['rate<0.02'], // Tingkat error maksimal 2%

    // Thresholds per Coverage Item
    latency_ci01_devices: ['p(95)<400'],       // CI-01: Katalog produk cepat (<400ms)
    latency_ci02_device_detail: ['p(95)<300'], // CI-02: Detail produk (<300ms)
    latency_ci03_imei_check: ['p(95)<250'],    // CI-03: Validasi IMEI lokal (<250ms)
    latency_ci04_price_checker: ['p(95)<2000'],// CI-04: AI Price Checker (<2000ms)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // ── Coverage Item CI-01: Public Catalog Fetch ─────────────────────────────
  group('CI-01: Katalog Perangkat (GET /api/devices)', () => {
    const res = http.get(`${BASE_URL}/api/devices`, {
      tags: { coverage_item: 'CI-01-devices' },
    });

    const isOk = check(res, {
      'CI-01: Status 200 OK': (r) => r.status === 200,
      'CI-01: Body memiliki list devices': (r) => {
        try {
          const json = JSON.parse(r.body);
          return Array.isArray(json.devices) && json.devices.length > 0;
        } catch (_) {
          return false;
        }
      },
    });

    devicesLatency.add(res.timings.duration);
    errorRate.add(!isOk);
    if (isOk) successfulRequests.add(1);
  });

  sleep(0.5);

  // ── Coverage Item CI-02: Device Detail Fetch ──────────────────────────────
  group('CI-02: Detail Perangkat Spesifik (GET /api/devices/dev1)', () => {
    const res = http.get(`${BASE_URL}/api/devices/dev1`, {
      tags: { coverage_item: 'CI-02-device-detail' },
    });

    const isOk = check(res, {
      'CI-02: Status 200 OK': (r) => r.status === 200,
      'CI-02: Data detail dev1 ditemukan': (r) => {
        try {
          const json = JSON.parse(r.body);
          return json.device && json.device.id === 'dev1';
        } catch (_) {
          return false;
        }
      },
    });

    deviceDetailLatency.add(res.timings.duration);
    errorRate.add(!isOk);
    if (isOk) successfulRequests.add(1);
  });

  sleep(0.5);

  // ── Coverage Item CI-03: IMEI Validation (Luhn & TAC Database) ───────────
  group('CI-03: Verifikasi IMEI Luhn & TAC (POST /api/imei-check)', () => {
    const payload = JSON.stringify({
      imei: '354285123456789', // TAC Galaxy S22
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { coverage_item: 'CI-03-imei-check' },
    };

    const res = http.post(`${BASE_URL}/api/imei-check`, payload, params);

    const isOk = check(res, {
      'CI-03: Status 200 OK': (r) => r.status === 200,
      'CI-03: Status VERIFIED': (r) => {
        try {
          const json = JSON.parse(r.body);
          return json.status === 'VERIFIED';
        } catch (_) {
          return false;
        }
      },
    });

    imeiCheckLatency.add(res.timings.duration);
    errorRate.add(!isOk);
    if (isOk) successfulRequests.add(1);
  });

  sleep(0.5);

  // ── Coverage Item CI-04: AI Price Valuation Cache Hits ────────────────────
  group('CI-04: AI Price Valuation (POST /api/price-checker)', () => {
    const payload = JSON.stringify({
      device: 'Galaxy S23 Ultra',
      brand: 'Samsung',
      condition: 'Good',
      storage: '256GB',
      ram: '8GB',
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { coverage_item: 'CI-04-price-checker' },
    };

    const res = http.post(`${BASE_URL}/api/price-checker`, payload, params);

    const isOk = check(res, {
      'CI-04: Status 200 OK': (r) => r.status === 200,
      'CI-04: Memiliki estimasi harga wajar': (r) => {
        try {
          const json = JSON.parse(r.body);
          return typeof json.price === 'number' && json.price > 0;
        } catch (_) {
          return false;
        }
      },
    });

    priceCheckerLatency.add(res.timings.duration);
    errorRate.add(!isOk);
    if (isOk) successfulRequests.add(1);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Bawaan k6 summary formatter
  return `
================================================================================
           LAPORAN HASIL PENGUJIAN OTOMATIS: COVERAGE ITEMS FOR PERFORMANCE
                                 GADGETTRUSTX - K6
================================================================================
Total Permintaan (Requests) : ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}
Keberhasilan Asersi Checks  : ${data.metrics.checks ? (data.metrics.checks.values.rate * 100).toFixed(2) : 0}%
Error Rate                  : ${data.metrics.coverage_error_rate ? (data.metrics.coverage_error_rate.values.rate * 100).toFixed(2) : 0}%

DURASI RESPON (LATENSI):
- Rata-rata (Avg)           : ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0} ms
- Persentil 95 (P95)        : ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0} ms
- Persentil 99 (P99)        : ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 0} ms

DETAIL PER COVERAGE ITEM:
- CI-01 (Katalog Devices)   : Avg = ${data.metrics.latency_ci01_devices ? data.metrics.latency_ci01_devices.values.avg.toFixed(2) : 0} ms | P95 = ${data.metrics.latency_ci01_devices ? data.metrics.latency_ci01_devices.values['p(95)'].toFixed(2) : 0} ms
- CI-02 (Detail Perangkat)  : Avg = ${data.metrics.latency_ci02_device_detail ? data.metrics.latency_ci02_device_detail.values.avg.toFixed(2) : 0} ms | P95 = ${data.metrics.latency_ci02_device_detail ? data.metrics.latency_ci02_device_detail.values['p(95)'].toFixed(2) : 0} ms
- CI-03 (Verifikasi IMEI)   : Avg = ${data.metrics.latency_ci03_imei_check ? data.metrics.latency_ci03_imei_check.values.avg.toFixed(2) : 0} ms | P95 = ${data.metrics.latency_ci03_imei_check ? data.metrics.latency_ci03_imei_check.values['p(95)'].toFixed(2) : 0} ms
- CI-04 (AI Price Checker)  : Avg = ${data.metrics.latency_ci04_price_checker ? data.metrics.latency_ci04_price_checker.values.avg.toFixed(2) : 0} ms | P95 = ${data.metrics.latency_ci04_price_checker ? data.metrics.latency_ci04_price_checker.values['p(95)'].toFixed(2) : 0} ms
================================================================================
`;
}
