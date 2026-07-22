---
name: cv-facts
description: Collate and maintain Bart's career facts store (career-facts.md, kept outside this repo) — the single source of truth for CV/cover-letter generation. First run ingests existing CV files and interviews Bart to fill gaps; later runs add new experience. Use before the first /cv-generate run, or whenever new experience/roles/projects need adding. Trigger on "/cv-facts", "update my CV facts", "add career facts", "collate my CV info".
version: 0.1.0
metadata:
  author: Bart Lind
  category: orchestration
---

# cv-facts

Collates and maintains `<facts-store path>` (e.g. `~/career-facts.md`) —
the single source of truth every `/cv-generate` run reads from. The path is
wherever you keep your personal facts store; set it once and reuse it
consistently across runs.

## Invocation

```
/cv-facts
```

No required arguments. Optionally pass one or more file paths to existing CV
documents to ingest them directly: `/cv-facts ~/Documents/cv-sales.docx ~/Documents/cv-tech.pdf`.

---

## Step 1 — Ensure the facts file exists

Check whether `<facts-store path>` (e.g. `~/career-facts.md`) exists.

If it does not, bootstrap it:

```bash
mkdir -p "$(dirname ~/career-facts.md)"
cp <this-repo>/templates/career-facts-schema.md ~/career-facts.md
```

Tell the user: "No facts file found — bootstrapped an empty one from the schema template."

---

## Step 2 — Determine mode

Read the file. If every section (`## Work Experience`, `## Freelance /
Contract`, `## Personal Projects`, `## Education`, `## Skills`, `##
Achievements / Metrics Bank`) contains only the commented-out template
placeholder and no real `### ` entries, this is **first-run ingestion mode**.
Otherwise this is **update mode** — skip to Step 4.

---

## Step 3 — First-run ingestion (first-run mode only)

1. Ask the user for the file paths to their existing CV documents if none
   were passed as arguments (Bart has mentioned: a recruitment/sales CV, an
   AI/tech CV, and possibly a sports coaching/teaching CV).
2. Read each file. For every distinct role, freelance engagement, or project
   found, draft a structured entry (org, role, dates, bullets) with a
   best-guess `tags:` domain assignment (`sales`, `admissions`, `coaching`,
   `ai-tech`).
3. Present the full consolidated draft to the user in chat before writing
   anything. Explicitly ask about known gaps the old CVs likely don't cover:
   - The Fridai contractor engagement building an app for a named client
     (dates, tech stack, responsibilities, outcomes).
   - AI data-annotation freelance work through Outlier (dates, scope).
   - The full list of personal AI/tech projects, and for each: confirm it is
     genuinely self-directed (`ground-truth: self-directed`) and note that
     it will be *framed* in client/consulting-facing language in generated
     CVs without inventing a named client or a false metric
     (`presentation-note: ...`).
4. Only after the user confirms, proceed to Step 5 to write.

**Critical:** never invent an employer, dates, or an achievement not stated
by the user or found verbatim in a source document.

---

## Step 4 — Update mode: add new facts

Ask the user what's changed or what they want to add (new role, new project,
new freelance engagement). Draft the new `### ` entry with a `tags:` value,
and — if it's a personal project — a `ground-truth:`/`presentation-note:`
pair as in Step 3.3. Present the draft addition before writing.

---

## Step 5 — Write to the facts store

Show the user a summary of exactly what will be added or changed. On
confirmation, write the updated content to `<facts-store path>`, preserving
every existing entry untouched — this is an additive/edit operation on the
real file, never a wholesale overwrite from a stale in-memory copy.

**Never write without an explicit confirmation from the user in the same
turn.**

---

## Step 6 — Report completion

Output in chat:

```
career-facts.md updated at <facts-store path>.
Run /cv-generate <job posting URL or text> to generate a tailored application.
```

---

## Critical rules

- Never invent a fact (employer, dates, metric, client name) not confirmed
  by the user or found verbatim in a source document.
- Every personal project framed in client-facing language must carry both
  `ground-truth: self-directed` and a `presentation-note:` — the ground
  truth field is never omitted or altered.
- Always show the user what will be written and get confirmation before
  writing to `career-facts.md`.

## File paths summary

| File | Purpose |
|---|---|
| `<this-repo>/templates/career-facts-schema.md` | Bootstrap source if the facts-store file is missing |
| `<facts-store path>` (e.g. `~/career-facts.md`) | The single source of truth this skill reads and writes |

## See also

- `/cv-generate` — consumes `career-facts.md` to produce a tailored
  application.
