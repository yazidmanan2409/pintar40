# PINTAR — Management & Educator presentation

One presentation, five files. The Bahasa Indonesia edition is canonical; the
English and bilingual editions are the same presentation in other languages,
not other presentations.

| File | Edition | Slides |
|---|---|---|
| `PINTAR-4.0-Management-Educators-ID.pptx` / `.pdf` | Bahasa Indonesia — **primary** | 25 core + 5 appendix |
| `PINTAR-4.0-Management-Educators-EN.pptx` / `.pdf` | English | 25 core + 5 appendix |
| `PINTAR-4.0-Management-Educators-Bilingual.pptx` / `.pdf` | Bahasa Indonesia primary, English secondary | 25 core + 5 appendix |
| `PINTAR-4.0-Executive-ID.pptx` / `.pdf` | Bahasa Indonesia, senior management | 10 + boundaries |
| `PINTAR-4.0-Executive-EN.pptx` / `.pdf` | English, senior management | 10 + boundaries |

Speaker notes are embedded in every slide of every file, in **both** languages —
Indonesian first, then English, separated by a rule. A presenter can deliver
the whole deck in either language without rewriting anything.

---

## Who it is for

School and institution **management**, and **educators**. Not engineers.
It assumes mixed digital literacy and answers, through the story rather than in
a FAQ, the questions each group actually arrives with: what problem does this
solve, what changes here, does it create work or remove it, can we trust the
information, does AI decide anything about a learner, and what does using it
feel like.

## How long it takes

| Route | Slides | Time |
|---|---|---|
| Full presentation | 1–25 | 30–35 min + discussion |
| Management-only | 1–5, 7, 12–19, 21–25 | 22–25 min |
| Educator-focused | all of 1–25, lingering on 6–14 | 35–40 min |
| Executive | the executive file, 1–11 | 10–12 min |
| Appendix (optional) | 26–30 | 3–8 min, opened on demand |

### The management route

Slides **1–5** (why), **7** (the cycle in one picture), **12–14** (what an
educator actually does), **15–19** (evidence, and why a certificate can be
trusted), **21–25** (see it yourself, direction, AI, what changes, close).

Slides that may be **skipped** for a management-only session: **6, 8, 9, 10,
11** — the learner screens. Management rarely needs the screen-by-screen walk;
slide 7 carries the cycle, and slide 24 carries what it means for learners.
Keep slide 11 if the room includes a principal or head of curriculum.

### The educator route

Give the most time to **6–11** (what a learner sees), **12–14** (what the
educator sees and does), and **16–17** (not yet enough evidence; observation is
not judgment). Those five minutes on 16–17 are what turn scepticism into trust;
they are the slides that say the system will not pass judgment on a teacher's
class or on a child.

Slide **13 (Uji Cepat)** is the one educators remember. Do not rush it.

### Appendix

All five appendix slides are optional and none is part of the running order.

| Slide | Open it when |
|---|---|
| 26 · Terminology | A term is queried |
| 27 · How PINTAR keeps its information reliable | The room includes quality assurance, audit or IT |
| 28 · Roles and scope | A foundation or principal asks who may do what |
| 29 · Boundaries we acknowledge today | Readiness or commitment comes up — **do not wait to be asked if a decision is on the table** |
| 30 · Future direction | Only if asked. Nothing on it is built, and nothing on it has a date |

---

## Language-version guidance

- **Indonesian audience** → the ID edition. It is the canonical one; the others
  were derived from it.
- **International or mixed-nationality audience with no Indonesian** → the EN
  edition. Note that product screens inside it stay in Indonesian, because they
  are reconstructions of the real interface; each carries a line saying so.
- **Mixed room, or a room where the record must be readable in both languages**
  → the bilingual edition. Indonesian is primary and English is secondary
  throughout, at a smaller size and in a lighter ink, never below 10pt.
- Do not mix editions inside one session. The claims are identical, but the
  pacing is not.

---

## What the presenter must not overclaim

These are not stylistic preferences. Each is a boundary the product has
recorded, and the deck is written so that none of them is contradicted.

1. **Never say "production ready", "fully tested", "a complete platform", or
   "guaranteed".** The PINTAR 4.0 core is complete; production readiness has
   not been declared. Load and stress validation is unfinished and human
   validation with real educators and learners is still ahead.
2. **Never say PINTAR "prevents cheating".** It supports process integrity.
   Integrity records are observations for a human to weigh; they never score
   and never convict.
3. **Never promise a management or dean dashboard as something that exists.**
   Slide 22 is labelled experience direction because that work is not built.
   There is no management screenshot in this deck, because there is no
   management screen.
4. **Never say a certificate is issued automatically the moment someone
   qualifies.** Say that certificates issued by the school can be verified.
   Issuance and verification work and have been proved on one complete journey;
   the learner's own certificate view is still being built.
5. **Never use the old wording "tidak masuk sertifikat" / "not part of a
   certificate"** for Uji Cepat. It is obsolete. A Quick Assessment can
   contribute learning evidence; a single one does not by itself issue a
   certificate.
6. **Never present Pemetaan Awal as a pre-exam or a placement test.** It has no
   score and no pass.
7. **Never call the Reading Map "adaptive AI" or a "machine-personalised
   curriculum".** It orders reading on the same material from the answers given
   on that material.
8. **Never name an accreditation framework, a data-retention period, or a
   learner-transfer policy.** All three are open product decisions.
9. **Never mention a future capability that is not on slide 30.** If asked,
   the correct answer is that it is not a product decision yet — not an
   invented timeline.
10. **Never say "salah" or "gagal" about a learner's work.** PINTAR says
    *belum tepat*. "Belum" leaves time open; "tidak" closes it, and the
    difference is the whole doctrine.

If a question goes past these boundaries, the honest answer — "that is not
decided yet" — is the strongest one available, and it is the answer slide 16
spends its whole existence earning.

---

## Before any external use

**The official PINTAR SELALU identity is not in this repository**, so the deck
uses a plain typographic wordmark instead of a logo. Nothing was redrawn or
approximated. To add the real mark:

- **Cover** — replace the "PINTAR" text at the top left (x 0.85", y 0.95",
  height about 0.4") with the supplied logo, keeping it small and quiet.
- **Footer** — the small "PINTAR" at the bottom left of each slide may stay as
  text, or be swapped for a single-colour mark no taller than 0.16".
- Keep the branding restrained. PINTAR SELALU is the maker, not a watermark on
  every object.

The deck expects **Plus Jakarta Sans** (free, Google Fonts). Without it,
PowerPoint substitutes a default sans and the layout still holds, but the
typography is not the product's. Install it on the presenting machine.

---

## Rebuilding

```
cd presentation/build
python3 build.py          # writes the five .pptx into presentation/
python3 audit.py          # cross-language and terminology audit
```

`build.py` measures every block before it places it and **fails** if a slide
would overflow in any edition — a slide that does not fit is a build error, not
a slide nobody looked at. `audit.py` checks both language sides, canonical
terminology, forbidden words, overclaims, speaker notes and the executive
subset.

PDFs:

```
soffice --headless --convert-to pdf --outdir . *.pptx
```

Editing the words means editing `build/content.py`, where each claim exists
exactly once in both languages; all five files then re-render from it. Editing
the look means editing `build/deck.py`. See `PROVENANCE.md` for what authorises
each claim, the four source conflicts found and how they were resolved, and
what was deliberately left out.
