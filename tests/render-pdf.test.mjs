// tests/render-pdf.test.mjs
import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { renderPdf } from '../scripts/render-pdf.mjs';
import { extractPdfText } from '../scripts/lib/extract-pdf-text.mjs';

const OUTPUT_PATH = 'tests/fixtures/tmp-render-test.pdf';

describe('renderPdf', () => {
  afterAll(() => {
    if (existsSync(OUTPUT_PATH)) rmSync(OUTPUT_PATH);
  });

  it('renders a populated template to a PDF whose text survives extraction', async () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));

    await renderPdf({
      templatePath: 'tests/fixtures/minimal-template.html',
      data,
      outputPath: OUTPUT_PATH,
    });

    expect(existsSync(OUTPUT_PATH)).toBe(true);

    const text = await extractPdfText(OUTPUT_PATH);
    expect(text).toContain('Jamie Test');
    expect(text).toContain('Increased enrollment conversion by 15% through targeted follow-up');
  });
});
