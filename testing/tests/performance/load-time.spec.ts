// Performance — waktu muat halaman (Navigation Timing API).
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/marketplace', '/login'];
const BATAS_MS = 3000; // kriteria: DOMContentLoaded < 3 detik

for (const path of PAGES) {
  test(`TC-018 Waktu muat ${path} < ${BATAS_MS} ms`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    const t = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) };
    });
    console.log(path, t);
    test.info().annotations.push({ type: 'timing', description: JSON.stringify(t) });
    expect(t.dcl).toBeLessThan(BATAS_MS);
  });
}
