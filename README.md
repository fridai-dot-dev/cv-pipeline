# Document Generation Pipeline

Generates tailored, client-facing documents (e.g. targeted CVs and
cover letters) from a single facts store with a strict never-invent
rule. Two Claude Code skills drive it: a facts-collation skill
(single source of truth) and an 11-step generation skill — research
fan-out, keyword-coverage gap check (a lightweight eval), humanizer
pass, human checkpoint, and rendering.

- One shared design system, two skins + a separate genuinely ATS-safe
  template (PDF via Playwright/Chromium, DOCX).
- Vitest suites: render, ATS structure, template population, smoke.
- WSL2 note: Playwright needs `LD_LIBRARY_PATH=.browser-libs`
  (see `scripts/install-browser-deps.mjs`).

Part of my portfolio: https://bart.fridai.dev
