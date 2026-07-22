// scripts/lib/extract-pdf-text.mjs
import { readFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export async function extractPdfText(pdfPath) {
  const buffer = await readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
