import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';

describe('playwright environment', () => {
  it('launches chromium and renders a PDF from HTML', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent('<h1>Smoke test</h1>');
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);
  });
});
