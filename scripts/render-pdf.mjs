// scripts/render-pdf.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { populateTemplate } from './lib/populate-template.mjs';

export async function renderPdf({ templatePath, data, outputPath }) {
  const templateHtml = readFileSync(templatePath, 'utf-8');
  const html = populateTemplate(templateHtml, data);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [templatePath, dataJsonPath, outputPath] = process.argv.slice(2);
  if (!templatePath || !dataJsonPath || !outputPath) {
    console.error('Usage: node scripts/render-pdf.mjs <templatePath> <dataJsonPath> <outputPath>');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(dataJsonPath, 'utf-8'));
  await renderPdf({ templatePath, data, outputPath });
  console.log(`Wrote ${outputPath}`);
}
