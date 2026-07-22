import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('ATS-safe CV template structure', () => {
  const html = readFileSync('templates/cv-ats/template.html', 'utf-8');

  it('contains no tables', () => {
    expect(html.toLowerCase()).not.toContain('<table');
  });

  it('contains no images', () => {
    expect(html.toLowerCase()).not.toContain('<img');
  });

  it('contains no multi-column layout', () => {
    expect(html).not.toMatch(/column-count\s*:/i);
    expect(html).not.toMatch(/display:\s*grid/i);
  });
});
