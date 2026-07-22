import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import mammoth from 'mammoth';
import { Document, Packer } from 'docx';
import { renderDocx, buildDocument } from '../scripts/render-docx.mjs';

const OUTPUT_PATH = 'tests/fixtures/tmp-render-test.docx';
const MINIMAL_OUTPUT_PATH = 'tests/fixtures/tmp-render-test-minimal.docx';

describe('renderDocx', () => {
  afterAll(() => {
    if (existsSync(OUTPUT_PATH)) rmSync(OUTPUT_PATH);
    if (existsSync(MINIMAL_OUTPUT_PATH)) rmSync(MINIMAL_OUTPUT_PATH);
  });

  it('renders CV data to a docx whose text survives extraction', async () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));

    await renderDocx({ data, outputPath: OUTPUT_PATH });

    expect(existsSync(OUTPUT_PATH)).toBe(true);

    const result = await mammoth.extractRawText({ path: OUTPUT_PATH });
    expect(result.value).toContain('Jamie Test');
    expect(result.value).toContain('Admissions Advisor');
    expect(result.value).toContain('Increased enrollment conversion by 15% through targeted follow-up');
  });

  it('includes Education and Skills section content for the fully-populated fixture', async () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));

    await renderDocx({ data, outputPath: OUTPUT_PATH });

    const result = await mammoth.extractRawText({ path: OUTPUT_PATH });
    expect(result.value).toContain('Education');
    expect(result.value).toContain('BA Communications — Test University (2018 - 2021)');
    expect(result.value).toContain('Skills');
    expect(result.value).toContain('CRM: Salesforce, HubSpot');
  });

  it('builds a valid Document in isolation via buildDocument(data)', async () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));

    const doc = buildDocument(data);

    expect(doc).toBeDefined();
    expect(doc).toBeInstanceOf(Document);

    // Confirm it's a genuinely packable document, not just a plain object shape.
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('renders CV data with optional/empty fields (no title, no education, empty skills) without throwing', async () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data-minimal.json', 'utf-8'));

    expect(data.profile.title).toBeUndefined();
    expect(data.education).toBeUndefined();
    expect(data.skills).toEqual([]);

    await expect(renderDocx({ data, outputPath: MINIMAL_OUTPUT_PATH })).resolves.not.toThrow();

    expect(existsSync(MINIMAL_OUTPUT_PATH)).toBe(true);

    const result = await mammoth.extractRawText({ path: MINIMAL_OUTPUT_PATH });
    expect(result.value).toContain('Alex Minimal');
    expect(result.value).toContain('Support Specialist');
    expect(result.value).toContain('Resolved customer tickets within SLA targets');

    // Absent/empty optional sections must not appear
    expect(result.value).not.toContain('Education');
    expect(result.value).not.toContain('Skills');
  });

  it('buildDocument(data) does not throw for minimal/empty-field data', () => {
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data-minimal.json', 'utf-8'));

    expect(() => buildDocument(data)).not.toThrow();
  });
});
