import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { renderPdf } from '../scripts/render-pdf.mjs';
import { extractPdfText } from '../scripts/lib/extract-pdf-text.mjs';

const cvData = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));
const coverLetterData = JSON.parse(readFileSync('tests/fixtures/sample-cover-letter-data.json', 'utf-8'));

const cases = [
  { template: 'templates/cv/professional.html', data: cvData, mustContain: ['Jamie Test', 'Admissions Advisor'] },
  { template: 'templates/cv/technical.html', data: cvData, mustContain: ['Jamie Test', 'Admissions Advisor'] },
  { template: 'templates/cv-ats/template.html', data: cvData, mustContain: ['Jamie Test', 'Admissions Advisor'] },
  { template: 'templates/cover-letter/professional.html', data: coverLetterData, mustContain: ['Jamie Test', 'Test University'] },
  { template: 'templates/cover-letter/technical.html', data: coverLetterData, mustContain: ['Jamie Test', 'Test University'] },
];

describe('design templates render to extractable PDFs', () => {
  it.each(cases)('$template renders and survives text extraction', async ({ template, data, mustContain }) => {
    const outputPath = `tests/fixtures/tmp-${template.replace(/[/.]/g, '-')}.pdf`;
    await renderPdf({ templatePath: template, data, outputPath });
    expect(existsSync(outputPath)).toBe(true);
    const text = await extractPdfText(outputPath);
    for (const fragment of mustContain) {
      expect(text).toContain(fragment);
    }
    rmSync(outputPath);
  });
});
