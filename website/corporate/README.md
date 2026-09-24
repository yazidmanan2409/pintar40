# PINTAR CORPORATE WEBSITE + MINI-PINTAR

**Date:** 2026-09-24 · **Status:** reconciled with the canonical PINTAR product, for Second Eye review.
**Not production. Not merged.** A test copy is served from `/test/corporate/` on the host, uploaded by the owner for review.

**Canonical baseline:** `main@2ac7ab6`, the patch baseline ruled on 24 Sep. It was re-read unchanged at `19f01b2`, `4030937` and `eb3256f`, the `main` tip this lane last merged. `eb3256f` brought Integrations 6 and 7 (BOB-03, BOB-04, DAISY-06, DAISY-09–11). None of them changed anything the website represents.

**Direction of authority:** the canonical PINTAR product decides, and this website represents it. Never the reverse.

```
python3 -m http.server 8000 --directory .
# then http://localhost:8000/ and the routes below; ?lang=en for English.
# Nothing is remembered: the language travels in ?lang= and nowhere else.
# Works from any folder (e.g. /test/corporate/): every link and asset is relative.
```

The 24 Sep review and plan that led here is [`REVIEW-2026-09-24-CANONICAL-RECONCILIATION.md`](./REVIEW-2026-09-24-CANONICAL-RECONCILIATION.md). This README describes the reconciled result.

---

## 1 · Where the authority sits

The site says what PINTAR is designed to do. It says it in the product's own words wherever the product has words:
- metric labels and meanings;
- readiness tiers and their thresholds;
- evidence states;
- the educator's and management's screen titles;
- the cycle names;
- role names;
- Uji Cepat and Pustaka PINTAR.

`verify/canonical.mjs` reads the product's own sources, not a copy of them:
- `src/lib/hle.ts`;
- the MC-1 catalogue migration;
- `pengajar.ts` / `pimpinan.ts`, for the figures each surface asks for;
- `globals.css`;
- `public/brand`, `public/fonts`;
- every migration that writes the catalogue or defines role capabilities.

It reports two different failures:

| Message | Meaning | What to do |
|---|---|---|
| `canonical product changed — website reconciliation required: …` | PINTAR no longer says what the website was reconciled against | Reconcile the **website** with the product, then re-record the snapshot |
| `website misrepresents canonical PINTAR: …` | The website says something the product does not | Fix the website |

`verify/canonical-snapshot.mjs` is **not a specification**. It records the product values the website was reconciled against, pinned to its source commit (`SOURCE_COMMIT = "2ac7ab6"`), so that verification is deterministic.

To re-reconcile after a product change:
1. Update the website.
2. Run `node verify/canonical.mjs --print --at <commit>`.
3. Re-record the snapshot from that output and set `SOURCE_COMMIT`.

Never edit a snapshot value to make a check pass. If the product sources are missing, the check fails; it never passes blind.

`node verify/canonical.mjs --at 2ac7ab6` proves that the snapshot matches its declared source commit.

---

## 2 · Routes

| Route | Purpose |
|---|---|
| `/` | Home: what PINTAR is designed to do, and who it is for (the product's four staff roles) |
| `/apa-yang-dilakukan/` | What PINTAR Does: the connected flow, and the product's cycle named once, by its own names |
| `/untuk-pendidik/` | For Educators: Pustaka PINTAR or your own material, with approval and publishing by the HoD and the school; Uji Cepat; patterns once enough learners finish; your decision |
| `/untuk-manajemen/` | For Management: reports about learning, not rankings of people; the roster, and the deliberate, recorded opening of one learner's record |
| `/cara-kerja/` | How It Works: the sequence PINTAR is designed to follow. Only answers on official assessments are evidence. |
| `/laporan/` | Reports: the educator's and management's screens, redrawn from MC-1 with simulated numbers |
| `/tentang/` | About: why PINTAR exists. The unsupported team claim is removed. |
| `/kontak/` | Contact: an inert request form. It says so. |
| `/mini-pintar/` | The single Mini-PINTAR (§5) |

---

## 3 · Identity

- **Public name:** PINTAR. No version name is used publicly anywhere on the site; `audit.mjs` checks the copy and scans every shipped file.
- **Logo:** the supplied PINTAR SELALU mark, copied byte for byte from `public/brand/pintar-selalu-logo.png` (sha256 `0e85e80f…`, checked).
  - It is rendered the product's way (`MerekPintar.tsx`): alt "PINTAR SELALU"; height 36 px (32 px on a phone); width never set.
  - In the header and footer the logo **links Home**, carrying `?lang=`. That is the website convention you allowed; the product's "not a link" rule is written for its app screens.
- **Colour:** `--brand-primary #245F55` plus its ink, soft and hover companions, all equal to the product's token set v2. The product's comment is "APPROVED, NOT FROZEN"; the site takes it as a reference and checks it against the product.
- **Brand and evidence are separate tokens.**
  - `--evidence-bar` (the product's ink-3), `--evidence-track` and `--evidence-absent-line` are never brand values, and no report style references a brand or status colour.
  - Readiness tiers are drawn as the product draws them (`BarisKesiapan`): one neutral bar for every tier, never a tier colour. That is why there is no `--tier-*` ramp.
- **Type:** Plus Jakarta Sans, self-hosted from the product's own files (latin and latin-ext, with the OFL licence), in the product's two weights, 400 and 600.
- **Copyright:** no legal entity is invented. The line says the holder is pending confirmation and that this is not a production site. The footer heading is "Tentang PINTAR", not "Perusahaan", so no company is implied.

## 4 · Language, and nothing kept

Bahasa Indonesia is the default and English is second. Every string is an `L(id, en)` pair.

The language travels **only** in `?lang=`, which every internal link carries. There is no localStorage, sessionStorage, cookie or IndexedDB anywhere on the site. This is checked in two ways:
- a source scan of every shipped file;
- a browser walk of every route, into Mini-PINTAR, followed by a check that the device holds nothing.

The site therefore holds itself to Mini-PINTAR's ADR rule ("no persistence of any kind, including browser storage") rather than to a weaker rule beside it.

**Relative, so it works from any folder.** The first upload, to `/test/corporate/`, showed the logo's alt text instead of the logo, and every menu link pointed at the domain's root. The site had been written for a domain root. Now no link or asset is written from the root.
- Routes keep their names (`"/laporan/"`) in the content, and `withLang()` turns each one into a path relative to the page it is on (`"../laporan/?lang=id"`).
- The logo goes through `siteAsset()`.
- Mini-PINTAR reaches the site through `"../"`.
- The site's root is found from the address of `shared/lang.js`, so no deployment path is written anywhere.

`audit.mjs` checks the helpers at every page depth and forbids a root-absolute link or asset in any shipped file. `view.mjs` and Mini-PINTAR's `journey.mjs` serve the whole site from `/test/corporate/`, the way the host does. They check that every link and asset is relative, lands inside that folder on a real route or file, and is actually served.

## 5 · Mini-PINTAR: one implementation

The approved M2 is the single public Mini-PINTAR.
- It was **moved** here with `git mv`, so its history is kept.
- The corporate arithmetic quiz was **retired**, not linked.
- `website/mini-pintar/app/` now holds only the shared browser tooling (`verify/driver.mjs`, `probes.mjs`) that the role views import. `audit.mjs` fails if anything else reappears there.

**The core is unchanged in governance.** It runs Pemetaan Awal → Peta Bacaan Personal → Pelajaran → Uji Penguasaan → Hasil, then "Itu tadi PINTAR", in *sekitar tiga menit*.
- The adaptation module is untouched.
- The evidence-limit sentence appears under every outcome.
- The misconception taxonomy stays internal.
- It is zero-write.

The subject stays *Membaca Angka*.

**Lesson and questions reconciled.** L-D2 and L-D3 each gain one worked-example step. Each step teaches the principle that the lesson's second Uji Penguasaan item tests:
- L-D2: what to say when evidence is thin;
- L-D3: what to do when the cause is unclear.

The questions, answer keys and rationales are unchanged. A new audit rule forbids any lesson line from sharing five or more consecutive words with any Uji Penguasaan option.

**"Lihat dari sisi sekolah" (optional, about one minute).** It is offered after the reveal and is never required.
- **The educator's side.** The visitor is the only learner in the class.
  - It opens with the product's own screen title and sentence: *"PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum."*
  - Next come *Mengumpulkan 1 / 1*, then the class figures. Each one reads *"Belum cukup data untuk menampilkan angka ini. (1/5)"*, or *(1/3)*, because MC-1's minimums are 5 and 3.
  - Kenaikan is not drawn, for the reason M2 already gives.
  - None of the visitor's answers is shown, because an educator does not see item-level answers in PINTAR either (`mengajar.bukti.kaki`).
  - The visitor then chooses between two of the product's own next steps and "Tidak ada tindakan sekarang". Nothing is preselected, and the choice is acknowledged as theirs and not kept.
- **The management side.** A class of 24, badged **DATA SIMULASI**, fixed for every visitor and "none of it from your answers".
  - It shows what a Head of department's view of a class asks for: Peserta, Pemahaman, Kenaikan (shown below its minimum, 4/5) and Sebaran kesiapan.
  - Sebaran kesiapan uses the four tiers word for word, with MC-1's rules, drawn as neutral bars.
  - Kesiapan bukti is **counted** from the figures, and the product's note follows.
- Exit, the logo and the three doors lead back into the site's real routes, carrying only `?lang=`.

## 6 · Reports, drawn from MC-1

`/laporan/` shows two cards that follow two real product screens.
- **Educator card: "Apa yang sudah bisa disimpulkan".**
  - Figures: Pemahaman, Kenaikan (below its minimum, 4/5), Penguasaan per topik, Pemahaman keliru yang berulang (with its suggested remedy) and Sebaran kesiapan.
  - The product's own action sentences are used, where its rule would pick them, and the product's footnote on what educators do not see.
- **Management card: "Yang didukung bukti".**
  - Figures: Peserta, Kenaikan, Butir wajib, and Capaian kompetensi (*"Belum ada bukti yang memenuhi syarat untuk angka ini."*).
  - Below them, Kesiapan bukti is counted from the figures.

Between them the page shows all three evidence states in use. The legend states them word for word, as the product does:
- *Cukup untuk ditafsirkan*;
- *Sudah ada, belum cukup*;
- *Belum ada yang memenuhi syarat*.

The principle is quoted word for word from the product: *"Bukti yang belum cukup bukan hasil yang buruk…"*.

The page makes these guarantees:
- It never shows a learner band. "Belum cukup bukti" is the state of a figure.
- It never guesses a cause.
- Every number is labelled simulated.

## 7 · What is designed, what is demonstrated, what is live

The three are kept apart on every page.
- **Designed:** capability is written as *PINTAR dirancang untuk… / PINTAR is designed to…* wherever the present tense could read as a working deployment.
- **Demonstrated:** Mini-PINTAR is labelled a demonstration, not an official assessment.
- **Live:** the site makes **no** claim. The footer says: *"Situs ini menjelaskan cara PINTAR dirancang bekerja. Mini-PINTAR adalah demonstrasi, bukan asesmen resmi. Untuk ketersediaan di sekolah Anda, bicaralah dengan kami."*

Adoption, availability, customer, partner-school and launch words are banned and checked. No removed claim was replaced with a new one.

## 8 · Verification

All of it runs locally with `bash verify/run-all.sh` (about 50 minutes; `--quick` skips the two browser-plant harnesses). There were **no GitHub Actions runs.** The results below are from the merged head `091cbfc`, with the site served from `/test/corporate/`; the commit that updates this README changes nothing else.

| Command | Result on `091cbfc` |
|---|---|
| `node verify/canonical.mjs` | OK — 432 checks: 63 copy rows, 16 MC-1 metrics, 4 tiers, 3 surfaces, 4 tokens, 4 assets |
| `node verify/canonical.mjs --at 2ac7ab6` | OK — 432 checks (the snapshot matches its source commit) |
| `node verify/audit.mjs` | OK — 152,639 checks; 516 public strings, 9 pages, 34 shipped files scanned for storage and root-absolute links |
| `node verify/view.mjs` | OK — 447 checks in Chromium, served from `/test/corporate/`; every link and asset relative and served |
| `bash verify/negative.sh` | 89 planted defects, 89 caught (11 product changes planted in a temporary copy) |
| `bash verify/negative-browser.sh` | 10 planted defects, 10 caught |
| `node mini-pintar/verify/audit.mjs` | OK — 11,561 checks |
| `node mini-pintar/verify/paths.mjs` | OK — 3,125 resolutions replayed identically |
| `node mini-pintar/verify/isolation.mjs` | OK — 266 checks |
| `node mini-pintar/verify/journey.mjs` | OK — 485 checks in Chromium, served from `/test/corporate/`; both school sides, both languages, keyboard only |
| `bash mini-pintar/verify/negative.sh` | 57 planted defects, 57 caught |
| `bash mini-pintar/verify/negative-browser.sh` | 10 planted defects, 10 caught |

**What the plants found.** Several of my own checks turned out to be unable to fail until a planted defect proved it. Each is now fixed:
- **The logo rule** was satisfied by the footer's link alone. It now counts every logo drawn.
- **The typeface rule** was satisfied by the second of two `@font-face` blocks. It now checks the stack too.
- **`canonical.mjs`** crashed, rather than reported, when a figure named a metric the website was never reconciled against.
- **Contrast of the new school-side marks** measured 2.92:1 against the card: the dashed "below minimum" rule and the badge edge. Both now use the neutral ink.

**What this does not prove:**
- that readers find the tone right;
- that final photography reads as documentary rather than stock;
- that the product's evaluator returns the states the illustrations draw for any real class. The illustrations are simulated and say so.

## 9 · For the coordinator and Second Eye: recorded, not resolved

No website claim depends on any item below.

- **A · Student → Educator feedback is implemented and in production.** This is ADR-0022/0023 (WP7B–D): anonymous feedback from students, and feedback cycles that Management opens about named educators. It conflicts with Management rulings R2/R4.
  - One consequence is visible here: `design/role-views/management/verify/audit.mjs` now fails, *by design*, with "the product now has feedback strings — this design's scope note is stale".
  - That file is outside this lane's boundary and was not touched.
- **B · ADR-0021 number collision.** This lane's `docs/adr/0021-mini-pintar-public-demonstration.md` shares its number with a different ADR-0021 on `main`, and OD-11 is still OPEN. The ADR needs renumbering at integration.
- **C · An observation about the product.** On `/pimpinan`, an evaluated `class.readiness_distribution` is rendered through `nilai()`, which prints the *number of tiers present* (a count of keys) rather than the distribution.
  - The website draws the catalogue's own visualisation for this metric (`distribution`).
  - The product was not changed.
- **D · An observation about the product.** The educator's evidence screen labels topic mastery "Penguasaan per bagian" when shown, but "Penguasaan per topik" (the catalogue label) when it is below minimum. The website uses the catalogue label.

**Where the result differs from the approved manifest's wording.** Each difference follows the product, per the direction of authority.

1. **Audience list.** It uses the product's role labels word for word: *Guru · Kepala departemen · Dekan · Admin sekolah*. The manifest had *Pimpinan Sekolah*, which is not a product role.
2. **Management figures.** These are the figures the product's management surface actually reads (`pimpinan.ts`).
   - The school card shows Capaian kompetensi, not Perbandingan angkatan, because no product surface renders cohort comparison.
   - Mini-PINTAR's management side shows class figures only. Topic mastery and recurring misunderstandings are educator figures (`pengajar.ts`), so they appear on the educator card.
3. **"Peta Bacaan Personal".** This is `cycle.step.map`, word for word, on the site and in Mini-PINTAR.
4. **The educator's side of Mini-PINTAR.** It shows *Mengumpulkan 1 / 1* under *Keadaan hari ini*, not a Peserta figure, because the product's educator evidence screen does not ask for `class.participants`. It shows the absence sentence, with have/needed, on each figure, as the product's card does. The state name *Sudah ada, belum cukup* appears in management's Kesiapan bukti.
5. **No `--tier-*` colour ramp.** See §3.
6. **Two more unsupported claims were qualified in the same class.** No new claim was added.
   - The footer tagline now reads "dirancang untuk…".
   - "Perusahaan / Company" is now "Tentang PINTAR".

## 10 · Before this could go live (gates, not proposals)

- The canonical findings above are ruled.
- The legal entity is confirmed, for © and the contact channel.
- Sprint 1 is released.
- Final photography (§11) is done.
- **Contact backend (spec only, nothing built):**
  - a named owner and a response commitment;
  - a destination decided, with no new service until it is ruled;
  - minimal fields, with phone optional;
  - a consent and privacy notice written for UU No. 27/2022 (PDP);
  - a retention period;
  - spam protection without a third-party tracker (a honeypot plus a server rate limit);
  - an audit trail;
  - no analytics;
  - confirmation copy rewritten to say what really happens.
- The design-sample banner comes off only when all of the above is true.
- Before any merge, re-check the current `main` and run `node verify/canonical.mjs`.

## 11 · Image placeholders

There are **eight**, itemised in [`PLACEHOLDERS.md`](./PLACEHOLDERS.md): two documentary photography briefs, two product-UI illustrations and four product mockups. The "who builds it" team photo was removed with the claim it illustrated. The identity is the supplied logo, not a placeholder.

## 12 · Boundary

Changes are confined to `website/corporate/` and the approved move out of `website/mini-pintar/app/`.

Nothing was changed in: the product code (`src/`, `supabase/`, `public/`), the ADRs, `design/role-views/`, the CI configuration, deployment, DNS or secrets.

The product was read, never modified. The product-change plants in `verify/negative.sh` mutate a temporary copy.

Deploy only the site itself. These are repository documents and tools, not pages: `README.md`, `REVIEW-*.md`, `PLACEHOLDERS.md`, `verify/`, `mini-pintar/README.md`, `mini-pintar/verify/`, and both `package.json` files.
