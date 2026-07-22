/**
 * Downloads and extracts the system libraries Playwright's Chromium needs on
 * WSL2 / Ubuntu Noble where sudo is unavailable, via `apt-get download`
 * (no root required) + manual .deb extraction.
 *
 * Run once after `npm install` and `npx playwright install chromium`:
 *   node scripts/install-browser-deps.mjs
 *
 * Output: .browser-libs/ (gitignored). Delete it to re-bootstrap.
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const TARGET = resolve('.browser-libs');

if (existsSync(TARGET)) {
  console.log('.browser-libs/ already exists — skipping. Delete it to re-bootstrap.');
  process.exit(0);
}

const tmp = join(tmpdir(), 'cv-pipeline-browser-deps');
mkdirSync(tmp, { recursive: true });

// Use specific versions to avoid apt repository sync issues
const PACKAGES = ['libnspr4', 'libnss3=2:3.98-1build1', 'libasound2t64'];

console.log('Downloading packages:', PACKAGES.join(', '));
const dl = spawnSync('apt-get', ['download', ...PACKAGES], {
  cwd: tmp,
  stdio: ['ignore', 'inherit', 'inherit'],
});

if (dl.status !== 0) {
  console.error('apt-get download failed — are you on a Debian/Ubuntu host?');
  process.exit(1);
}

mkdirSync(TARGET, { recursive: true });
const debs = readdirSync(tmp).filter((f) => f.endsWith('.deb'));

for (const deb of debs) {
  console.log('Extracting', deb);
  const extracted = join(tmp, 'extracted');
  mkdirSync(extracted, { recursive: true });
  spawnSync('dpkg', ['-x', join(tmp, deb), extracted], { stdio: 'inherit' });
  execSync(`cp -r ${extracted}/usr/lib/x86_64-linux-gnu/*.so* ${TARGET}/`, { stdio: 'inherit' });
  rmSync(extracted, { recursive: true, force: true });
}

rmSync(tmp, { recursive: true, force: true });
console.log('Done. System libs installed to .browser-libs/');
console.log('Run `npm test` to verify.');
