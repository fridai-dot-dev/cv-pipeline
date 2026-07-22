# cv-pipeline

CV/cover-letter generation pipeline: takes a job posting, tailors a CV and
cover letter from a career facts store, checks ATS/AI-screening keyword
coverage, and renders a rich-design PDF plus an ATS-safe PDF/DOCX pair.

## Key facts for working in this repo

- Career facts live in an external facts-store file, not this repo — see
  `.claude/skills/cv-facts/SKILL.md` for the path convention (e.g.
  `~/career-facts.md`). Never invent a fact not present there or in a job
  posting.
- Playwright-dependent commands need `LD_LIBRARY_PATH=.browser-libs`
  (WSL2 workaround — see `scripts/install-browser-deps.mjs`). `npm test`
  already sets this; ad hoc `node scripts/render-pdf.mjs` invocations need it
  prefixed manually.
- Tests: `npm test` (Vitest). Run a single file with `npm test -- <pattern>`.
- Two skills drive everything: `.claude/skills/cv-facts/SKILL.md` and
  `.claude/skills/cv-generate/SKILL.md`.
- One shared design system, two skins (`professional`, `technical`) — do not
  add a third skin or a bespoke per-application design without discussing it
  first; that was an explicit scope decision (see the design spec §5).
