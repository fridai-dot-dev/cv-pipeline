import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { populateTemplate } from '../../scripts/lib/populate-template.mjs';

describe('populateTemplate', () => {
  it('fills profile fields and loops over experience bullets', () => {
    const template = readFileSync('tests/fixtures/minimal-template.html', 'utf-8');
    const data = JSON.parse(readFileSync('tests/fixtures/sample-cv-data.json', 'utf-8'));

    const html = populateTemplate(template, data);

    expect(html).toContain('Jamie Test');
    expect(html).toContain('Results-driven sales professional with 5 years of experience.');
    expect(html).toContain('Admissions Advisor at Test University');
    expect(html).toContain('Increased enrollment conversion by 15% through targeted follow-up');
    expect(html).toContain('Managed a portfolio of 200+ prospective student relationships');
  });
});
