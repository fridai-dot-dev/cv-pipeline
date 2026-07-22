---
name: cv-generate
description: Per-application pipeline — takes a job posting, lightly researches the role/company, tailors a CV and cover letter from career-facts.md, checks ATS/AI-screening keyword coverage, and renders a rich-design PDF plus a genuinely ATS-safe PDF/DOCX pair. Use for every job application once career-facts.md exists (run /cv-facts first if not). Trigger on "/cv-generate", "generate a CV for this job", "tailor my CV", "write a cover letter for".
version: 0.1.0
metadata:
  author: Bart Lind
  category: orchestration
---

# cv-generate

Turns one job posting into a tailored, ATS-optimized CV + cover letter.
Unlike `/cv-facts`, the tailoring/drafting steps in this skill are **model
reasoning done by Claude directly in this conversation** — not delegated to
a script. Only rendering (PDF/DOCX) and file/tracker bookkeeping are
scripted.

## Invocation

```
/cv-generate <job posting URL or pasted job description text>
```

---

## Step 1 — Verify the facts store exists

Check `<facts-store path>` (the file maintained by `/cv-facts`, e.g.
`~/career-facts.md`) exists and has at least one real `### ` entry under
`## Work Experience`.

**Error:** if missing or still just the empty schema template, stop and
tell the user: "No career facts found. Run `/cv-facts` first to build your
facts store."

---

## Step 2 — Intake

If the argument looks like a URL, use the `firecrawl-scrape` skill to fetch
the job posting. Otherwise treat the argument as pasted job-description
text directly.

From the posting, extract (as plain reasoning, no script):
- role title
- company name
- seniority signal (junior/mid/senior, if stated or implied)
- a bullet list of the JD's key requirements/keywords (skills, tools,
  qualifications, years of experience) — this list is reused unchanged in
  Step 6, not re-extracted.

**Error:** if the URL fails to scrape (paywall, login, heavy JS), tell the
user: "Couldn't fetch that URL cleanly — can you paste the job description
text instead?" and wait for pasted text before continuing.

---

## Step 3 — Determine the domain tag

From the role title and JD content, pick one of `sales`, `admissions`,
`coaching`, `ai-tech`. If ambiguous, ask the user directly rather than
guessing. This determines which template skin is used in Step 8
(`professional` for sales/admissions/coaching, `technical` for ai-tech).

---

## Step 4 — Light company/role research

Create the application folder first:

```bash
mkdir -p "applications/<company-slug>-<role-slug>-<date>"
```

(slugs = lowercased, spaces to hyphens, e.g. `test-university-admissions-advisor-2026-07-01`)

Save the job posting to `job-posting.md` in that folder.

Using the `firecrawl-scrape` skill, fetch the company's own site (about/
mission page if discoverable from the posting or a quick search). Optionally
one `firecrawl-search` call for recent company news. **2-4 fetches total —
this is a light fan-out, not the full `/deep-research` protocol.**

Write findings (or their absence) to `research-notes.md` in the same folder.

**Error — thin/no results:** if the company has no discoverable site or
research turns up nothing useful (common for small employers), note this
plainly in `research-notes.md` ("No usable company research found — proceeding
on job-posting content only") and continue. Never fabricate company details
to fill the gap.

---

## Step 5 — Select and tailor

Read `<facts-store path>` (`career-facts.md`). Select the
work-experience, freelance, and project entries tagged with the Step 3
domain (plus any clearly transferable entries). Draft two JSON files
matching the exact contracts below, reordering/reweighting bullets to
mirror the JD's language and priorities, and drafting the cover letter using
the Step 4 research hooks:

**CVData** (`applications/<folder>/cv-data.json`):
```
{
  profile: { name, title, email, phone, location, summary, links: [{label, url}] },
  experience: [{ role, org, dates, bullets: [string] }],
  education: [{ credential, org, dates }],
  skills: [{ category, items: [string] }]
}
```

**CoverLetterData** (`applications/<folder>/cover-letter-data.json`):
```
{
  profile: { name, email, phone, date },
  recipient: { company, hiring_manager },
  body_paragraphs: [string]
}
```

Any personal project drawn from `career-facts.md` that carries a
`presentation-note:` must be worded per that note (client/consulting-facing
framing) — but the underlying facts (what was built, for whom, what
outcome) must not be invented beyond what `career-facts.md` states.

**External-audience language rule** (applies to every drafted field):
- Use external display names from `career-facts.md` headings — never repo
  slugs or internal codenames (e.g. `<internal-repo-slug>`).
- Every project/engagement description leads with plain-English purpose —
  who it serves and what problem it solves — before any stack or technique
  detail (use the entry's `Purpose:` bullet where present; otherwise draft
  the purpose clause from the entry's facts).
- Never state fee or contract amounts, even where `career-facts.md`
  records them as ground truth ("paid engagement" without a figure is
  fine).
- Test: a non-technical founder should understand the first clause of
  every bullet.

---

## Step 5.5 — Humanizer pass

Invoke the `humanizer` skill and run it over every drafted prose field —
the CV profile summary, every experience bullet, and all cover-letter
body paragraphs — revising the Step 5 drafts in place. This runs before
the Step 6 ATS check so keyword coverage is measured against the final
text.

---

## Step 6 — ATS keyword-coverage check

Compare the tailored CVData bullets/skills against the JD keyword list
extracted in Step 2. List any keyword with no reasonable match. Present this
gap list to the user in chat:

> "These keywords from the posting don't show up in your tailored CV: <list>.
> If any of these reflect real experience not yet in your facts store, run
> `/cv-facts` to add it — otherwise I'll leave them out rather than claim
> something that isn't there."

Write the gap list to `applications/<folder>/ats-coverage-report.md`
alongside the full matched-keyword list.

---

## Step 7 — Save the intermediate data files

Write `cv-data.json` and `cover-letter-data.json` (from Step 5) into the
application folder now, before rendering.

---

## Step 8 — Render

Let `<skin>` = `professional` or `technical` per Step 3. Run via Bash:

```bash
LD_LIBRARY_PATH=.browser-libs node scripts/render-pdf.mjs templates/cv/<skin>.html "applications/<folder>/cv-data.json" "applications/<folder>/cv.pdf"
LD_LIBRARY_PATH=.browser-libs node scripts/render-pdf.mjs templates/cv-ats/template.html "applications/<folder>/cv-data.json" "applications/<folder>/cv-ats.pdf"
node scripts/render-docx.mjs "applications/<folder>/cv-data.json" "applications/<folder>/cv-ats.docx"
LD_LIBRARY_PATH=.browser-libs node scripts/render-pdf.mjs templates/cover-letter/<skin>.html "applications/<folder>/cover-letter-data.json" "applications/<folder>/cover-letter.pdf"
```

**Error:** if any command exits non-zero, show the stderr to the user and
stop — never present a silently-broken PDF/DOCX as finished.

---

## Step 9 — Human checkpoint

Present to the user: the folder path, the ATS coverage report contents, and
a summary of what was tailored/emphasized and why. Ask if any adjustments
are needed. If the user requests changes, return to Step 5 (or Step 4 if it
requires more research), rerun Steps 5.5 and 6, and re-render only the affected outputs.

---

## Step 10 — Track

Append one row to `tracker.csv`:

```
<today's date>,<company>,<role>,<domain>,drafted,applications/<folder>,
```

---

## Step 11 — Report completion

Output in chat:

```
Done — applications/<folder>/ contains cv.pdf, cv-ats.pdf, cv-ats.docx, and cover-letter.pdf.
Logged to tracker.csv as "drafted". Update the status column once you've applied.
```

---

## Error handling summary

- JD URL won't scrape → ask for pasted text (Step 2).
- Thin/no company research → proceed on JD content alone, note the gap, never fabricate (Step 4).
- JD wants experience not in `career-facts.md` → surfaced in the coverage report, not invented (Step 6).
- Rendering failure → surfaced clearly, stop (Step 8).
- Re-running for a company/role whose folder already exists → ask the user whether to version (append `-2` to the folder name) or overwrite, before creating anything.

## Critical rules

- Steps 2, 3, 5, 5.5, 6, and 9 are Claude's own reasoning in this conversation —
  not delegated to a script. Only Step 8 (rendering) and Step 10 (tracker
  append) are mechanical.
- Never invent a company detail, a keyword match, or a CV fact not present
  in `career-facts.md` or the job posting/research.

## File paths summary

| File | Purpose |
|---|---|
| `<facts-store path>` (e.g. `~/career-facts.md`) | Input: source of truth for tailoring |
| `applications/<folder>/job-posting.md` | Output: saved posting |
| `applications/<folder>/research-notes.md` | Output: light company/role research |
| `applications/<folder>/cv-data.json`, `cover-letter-data.json` | Output: intermediate tailored data |
| `applications/<folder>/ats-coverage-report.md` | Output: keyword-coverage gaps |
| `applications/<folder>/cv.pdf`, `cv-ats.pdf`, `cv-ats.docx`, `cover-letter.pdf` | Output: final documents |
| `tracker.csv` | Output: appended application row |

## See also

- `/cv-facts` — must be run first to populate `career-facts.md`.
