// Usability — aksesibilitas (axe-core) & responsif di layar HP.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/marketplace', '/login'];

for (const path of PAGES) {
  test(`TC-019 ${path} tanpa pelanggaran aksesibilitas kritis`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const kritis = result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    console.table(kritis.map(v => ({ rule: v.id, impact: v.impact, elemen: v.nodes.length })));
    expect.soft(kritis, 'pelanggaran critical/serious').toEqual([]);
  });
}

test.describe('Tampilan mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  for (const path of PAGES) {
    test(`TC-020 ${path} tidak ada scroll horizontal di layar 375px`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
