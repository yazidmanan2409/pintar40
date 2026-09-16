# PINTAR 4.0 — UX-1 SLICE 0 + SLICE 1 — SECOND EYE VERIFICATION HANDOFF

**Written:** 2026-09-16 · **By:** Daisy (the Claude Code implementation session) · **Covers:** the completed Slice 0 + Slice 1 implementation on branch `ux-1/daisy-experience`, off the frozen Core baseline `9b2cc5d1075f21b3d1f61a32a83ba1b07d25a3ba` · **Authority:** `claude/DAISY-UX-1-SLICE-0-EXECUTION-PROMPT.md` §5 as amended by the Sauron Execution Amendment of 2026-09-16 §2 — one handoff at the end of Slice 1, not one before each slice.

**Second Eye remains paused.** This document exists so that when it is called, the evidence is already written down. It goes to Yazid/Sauron with the rest of the implementation package first.

**Evidence tags** are used throughout: DOCUMENTED (stated in a frozen document), OBSERVED (measured against the frozen schema or a running artefact), INFERRED (reasoned from the two), PROPOSED (a decision this session made).

---

## 0. Preflight, recorded verbatim

```
git rev-parse HEAD              → 9b2cc5d1075f21b3d1f61a32a83ba1b07d25a3ba   ✓
ls supabase/migrations | wc -l  → 83                                          ✓
git status --porcelain | wc -l  → 0                                           ✓
git checkout -b ux-1/daisy-experience                                         ✓
npm ci                          → 395 packages, 0 vulnerabilities             ✓
npm run typecheck               → clean                                       ✓
npm run selftest:local          → 25 passed, 3 failed, 59 skipped → RED
node scripts/baseline-parity.mjs → OK — 25 documents byte-identical           ✓
```

**The three baseline failures were diagnosed before anything was edited, and they are environmental, not Core.** `F01-R01`, `F05-R01` and `F06-R01` are the route tests; every route returned 500 including `/` and `/masuk`. The selftest runner adds the `app` facility unconditionally and boots a production build, and this container had no Supabase environment, so the app could not construct its client. `.github/workflows/ci.yml` supplies exactly these variables to the selftest job. Providing the same placeholders in an untracked `.env.local` turned the run green:

```
npm run selftest:local (env provisioned) → 28 passed, 0 failed, 59 skipped, 0 contract problems → RED
```

`RED` is the correct and structural local verdict: 59 cases require a live Postgres and carry no `skip_justification`, so `--accept-justified-skips` cannot accept them. **The measure that matters locally is `0 failed, 0 contract problems`, and that is what the baseline gave.** No Core file was touched to obtain it.

The local Supabase stack could not be started in this container — `ghcr.io` image blobs answer `403 Forbidden` through the agent proxy — so the `db` facility is absent for the whole of this work. **Every database-backed case therefore runs for the first time at the CI gate.** This is the single largest bound on everything below.

**After Slice 0 + Slice 1:**

```
npm run typecheck                → clean
npx eslint src selftest          → clean, 0 warnings
npm run build                    → compiled successfully; /belajar/sertifikat and
                                   /belajar/[tugas]/sertifikat are served
npm run selftest:local           → 35 passed, 0 failed, 59 skipped, 0 contract problems
node scripts/baseline-parity.mjs → OK — 25 documents byte-identical
```

Seven cases were added and all seven pass: `UX1-S0-TOKEN-01`, `UX1-S0-CONTRAST-01`, `UX1-S0-HLE-01`, `UX1-S0-LANG-01`, `UX1-S1-CERT-COLS-01`, `UX1-S1-CERT-ELIGIBLE-01`, `UX1-S1-QR-01`.

---

## 1. The exact certificate column list (Q-11)

The list page reads `public.certificates` directly through the person-scoped RLS policy with **exactly these ten columns and no other**:

```
id, session_id, institution_id, certificate_number, verification_token,
status, issued_at_iso, revoked_at, revoked_reason, supersedes_certificate_id
```

It exists once in the codebase, as `LIST_COLUMNS` in `src/lib/sertifikat-kontrak.ts`. `UX1-S1-CERT-COLS-01` asserts three things over the source:

1. the exported list is those ten names, in that order;
2. every `.from("certificates").select(...)` anywhere under `src/` passes `LIST_COLUMNS` and not a second list written inline;
3. `signature`, `key_version`, `canonical_payload` and `snapshot_id` are **named nowhere** on a learner surface — not requested, not rendered, not retained, not logged, not printed.

`institution_id` is present per the 2026-09-16 addition to the ruling: without it nothing resolves the issuing institution, which the learner reads through `institutions_select` (`is_member_of_institution(id)`).

**The detail page does not use this read at all.** It uses `my_certificate(p_session)` — the LEARNER RPC — which returns seven fields and no key material. `Q-11`'s STOP condition ("if the cryptographic fields cannot be excluded without a backend change") was **not reached**: the fields are excluded by not asking for them.

---

## 2. The nine return criteria

### 2.1 Role and capability boundaries

No surface added in this slice decides authority. OBSERVED, by construction:

- The certificate list is an RLS `select`; `certificates_select` is `person_id = current_person_id() OR can_in_institution('CAN_ASSIGN_LEARNING', institution_id)`, and the page adds no filter of its own.
- The detail page calls `my_certificate`, which raises inside the function if `session_is_mine(p_session)` is false. The page catches that and renders the refusal; it never pre-checks ownership itself.
- `PemilihLingkup` (`src/lib/lingkup.ts`, `src/components/PemilihLingkup.tsx`) lists what `org_nodes` and `classes` already return to this viewer under RLS. It never consults a role name. A scope not in the RLS result is not in the DOM, and the server re-resolves the chosen id against the same read on every request.
- `displayRole` is not read anywhere in Slice 0 or Slice 1.

### 2.2 Tenant isolation

No cross-tenant read was added. `institutionNames()` reads `institutions` under `institutions_select`, which is the learner's own membership. `layoutFor()` reads `certificate_templates` under `certificate_templates_select`.

**One OBSERVED fact worth Second Eye's attention:** `certificate_templates_select` is `can_in_institution('CAN_PUBLISH', institution_id)`, so **a learner never reads a template row.** The read is still made — it is the authorized read, and a staff viewer would receive their row — and when it returns empty the sheet falls back to the single layout the `certificate_templates_layout_known` constraint permits, named as `DEFAULT_LAYOUT = "CLASSIC"` rather than left implicit. **No backend change is proposed and none is needed:** the learner's sheet is correct under the fallback. This is recorded here because the execution prompt listed `certificate_templates.layout` as contract the slice may use, and the honest report is that for the learner persona it returns nothing.

### 2.3 No frontend hiding as authorization

Nothing in this slice hides a row the database returned. The distinction is kept at the read:

- The ten-column list is what is *requested*. There is no eleventh column arriving and being dropped in the client.
- An ELIGIBLE certificate's suppressions (§2.9) are not hiding either: `certificate_signed_when_issued` means an ELIGIBLE row can hold `signature` and `key_version` only as NULL, so the state Slice 1 meets by default carries nothing to hide. What is suppressed is the *presentation* of a number and a token that exist but that `verify_certificate` refuses — see §2.9 for why showing them would be the dishonest option.
- The single refusal page (`HalamanPenolakan`) has **no prop for a reason**, so no caller can leak one. Unauthorized, nonexistent and expired reach the same component with the same copy.

### 2.4 No ID/EN divergence

`UX1-S0-HLE-01`: every one of the 416 keys in `src/lib/hle.ts` carries both an Indonesian and an English telling, and a persona override exists in both languages or in neither. The `Telling` type requires `default` and `en`, so a key added without English **does not compile** — the static test is the second wall, not the first.

`UX1-S0-LANG-01`, the bilingual identity: the learner cycle's read path and the certificate read are driven twice, once per language, through a recording client; the recorded RPC call sequence and payloads are byte-identical. The structural half asserts that no source file under `src/` passes the language into an RPC, a write or a filter, that the cookie name is declared exactly once, and that **no migration gives the interface language a column**.

The internal-word guard, which previously ran for a learner and the public only, now runs **for every persona and both languages**, with `STAFF_ONLY_PREFIXES` retained as the scoped audience declaration (F05-S03 asserts the same declaration from the other side). 2,742 renderings are swept.

**PROPOSED, and flagged for the record:** the execution prompt specifies `en-ID` as the English locale tag. ICU resolves `en-ID` to English month names with Indonesian digit grouping (`1.234,5`). On every Slice 1 surface this is byte-identical to the approved prototype's `en-GB` rendering, because Slice 1 renders no number with a separator or a decimal. It will diverge visibly the first time a report renders one. I implemented the prompt as written and am naming the consequence rather than quietly substituting `en-GB`.

### 2.5 A refusal discloses nothing

One component, `src/components/HalamanPenolakan.tsx`, for unauthorized, nonexistent and expired alike. It takes a copy key and a way back, and nothing else. The four pre-existing refusal paths (`auth.not_yet` ×2, `studio.refused`, `config.refused`) were re-wired through it **without changing a single server decision** — the branch conditions above each one are untouched; only the telling moved.

Slug handling: an unauthorized scope and a nonexistent scope both fail to appear in the RLS read, so `resolveScope()` returns `null` for both and the surface renders the same refusal. Slugs are presentation and are never an existence oracle.

### 2.6 Canonical assessment behaviour

**Nothing in this slice touches assessment.** No item player, no scorer, no engine, no second verification path, no new client-callable surface, no migration, no RPC, no policy, no invariant, no schema change. The blocked routes `/belajar/kuis/*` and `/belajar/latihan/*` were not created. `POST /api/certificates/issue` is not imported, not called and not linked from any learner page — `UX1-S1-CERT-COLS-01` asserts this over the source (V-6a).

`HalamanKomitmen` is a *shell* only. It is not wired to any assessment surface in this slice; the submit commitment is Slice 4's, which is not authorized.

### 2.7 Evidence semantics

The four evidence components live in `src/components/bukti/` and consume the `metric_evaluate` envelope exactly (`status`, `label_key`, `meaning_key`, `statement_key`, `value`, `have`, `needed`):

- **`AngkaBerdiri`** — value, meaning, sample n/needed, action sentence. All four slots are required by the props; the action slot cannot be empty (S-3).
- **`KartuKetiadaan`** — four variants, and **the variant is derived from the envelope's status, never passed in**, so a surface cannot choose a gentler sentence than the fact deserves. `tidak_untuk_anda` renders **with no label**, because naming the metric would tell a reader exactly what is being withheld.
- **`BarisKesiapan`** — the tier word from an HLE key, and **no status colour**: every bar is `ink-3`, so a distribution reads as a shape rather than as an alarm about particular children.
- **`BarisLingkup`** — **the mark slot renders nothing when there is no mark (Q-7)**. Not a grey square, not initials, not a PINTAR logo standing in for a school's. When the column arrives, `markUrl` arrives with it.

`src/app/_intel.ts` was refactored onto these components: one definition of the envelope, one definition of which absence a status is. **The two report surfaces are unchanged** — they keep this module's exports, which is why the exports kept their names. Its `card` class, which carried four untokenized values including a shadow the design language does not have, is now the evidence card.

### 2.8 No duplicate execution path

- **One verification path.** `/verifikasi/[token]` still fetches `/api/verifikasi/[token]`, which is still the only place that holds the key and the only place `@/lib/supabase/service` is used. No client code compares a signature. The page was re-set on the v2 foundations; **the request it makes is byte-identical to the one at 9b2cc5d**.
- **One language mechanism.** One cookie name, declared once, asserted by `UX1-S0-LANG-01`.
- **One refusal page.**
- **One certificate column list.**
- **One QR implementation**, in `src/lib/qr.ts`, used by both the screen card and the printed sheet.
- **One A4 composition.** The screen card and the sheet are the same `KartuSertifikat` component under two variants, so the printed sheet cannot drift from what was on screen.

### 2.9 Built matches approved

The approved rendering is the published prototype (Artifact "PINTAR Sertifikat & Fondasi", `pintar-slice-0-1.html`, v2) and the review images in `PINTAR-UX1-v2-visual-review.zip`. Every class in `src/app/experience.css` is the prototype's product CSS restated in tokens; the review harness (the header bar, the notes panel, the stage) is not carried over.

Rendered and screenshotted at 1280 and 390 CSS pixels, both languages, twelve screens — twenty-four pages, forty-eight images. The three presentation decisions from the v2 visual pass are implemented as ruled:

**(a) REVOKED** renders the credential — institution, name as issued, course, predikat, date, number — beneath the "dicabut oleh penerbit" banner, and **no QR, no verification link, no copy-link and no print action**: the row is a retained record, not a credential to present. The revocation reason is not shown to the learner beyond that sentence.

**(b) SUPERSEDED** renders the same way beneath the "digantikan" banner.

**(c) TIDAK SAH** on `/verifikasi/[token]` shows **the status hero only**. The five-field response is still received unchanged — the page asks for nothing different — but the four facts are not rendered beneath a red verdict, because that would present a forged certificate's own claims as facts. BERLAKU, DICABUT and DIGANTIKAN render hero plus facts.

List rows are eyebrow (subject · class) / chapter title / date + status pill; on phone the pill joins the meta row. Certificate numbers are IBM Plex Mono 500 everywhere they appear.

---

## 3. The contract facts this slice is built around

All three OBSERVED against `supabase/migrations/20260914103000_certificates_core.sql` at 9b2cc5d, and all three confirmed by reading the frozen SQL in this session:

1. **`my_certificate` does not filter by status** (line 376: `where c.session_id = p_session and c.supersedes_certificate_id is null`), so it returns ELIGIBLE rows. The detail page applies the ELIGIBLE binding to its result, not only to the list's. `UX1-S1-CERT-ELIGIBLE-01` asserts the binding and the branch order.
2. **`certificates_one_root_per_session`** — `UNIQUE (session_id) WHERE supersedes_certificate_id IS NULL` (line 97) — guarantees `my_certificate` returns exactly the root certificate for a session. There is no forward pointer; the replacement is found through the list read, following `supersedes_certificate_id` to the end of the chain. The ten columns already carry both fields.
3. **`certificate_signed_when_issued`** — `CHECK (status = 'ELIGIBLE' OR (signature IS NOT NULL AND key_version IS NOT NULL))` (line 90).

**The ELIGIBLE binding, and why it is the whole design of the pending state.** OBSERVED: `certificate_prepare` creates the row as ELIGIBLE with `verification_token`, `certificate_number`, `issued_at_iso` and an identity snapshot **already assigned**, and `verify_certificate` refuses ELIGIBLE tokens. A link shown in this state would send a stranger to "not found" for a certificate the learner had just been shown as real. So while a certificate is ELIGIBLE the QR code, the verification link, the copy-link action, the print action, the certificate number and the name-as-issued are all suppressed, and the page says it is being prepared. **The page re-reads; it never issues.**

---

## 4. What is PENDING, and what is bounded

### 4.1 End-to-end issuance acceptance: **PENDING Bob's lifecycle step.**

The lifecycle does not issue; that is Bob's bounded gap (V-6a). No learner page calls the service-role issuance route. Slice 1 was built against the contract's states rather than against a hosted issuance, and **Slice 1 is not end-to-end complete and must not be represented as such.** Under this ruling ELIGIBLE is the default state a learner meets, not an edge case.

### 4.2 A replacement certificate has no learner-side detail read.

OBSERVED, and this session's finding rather than a repeat of a known one: **nothing in the frozen schema ever writes a non-null `supersedes_certificate_id`** — there is no reissue function at all. And by the definition in `certificates_one_root_per_session`, a replacement (non-null `supersedes_certificate_id`) is the root of *no* session, so `my_certificate` — which is per-session and root-only — can never return it for any session.

Consequence: the "digantikan" banner's primary action opens **the replacement's own public verification page**, addressed by the `verification_token` the ten-column list already carries. That surface is authoritative about the newer certificate and reachable within the contract. It does not show the holder their own name, which is on the certificate they hold.

**This is reported, not repaired.** A learner-side detail view of a replacement needs a reissue lifecycle that does not exist; it belongs with V-6a as Bob's, not as a UX-1 change. Classified per bootstrap §10 as a question for Sauron: *is the replacement's verification page the intended destination, or should the reissue lifecycle carry a learner-side read when it is built?*

### 4.3 The `db` facility never ran here.

Every database-backed case in the manifest — all 59 — ran for the first time at CI, not in this session. Nothing in Slice 0 or Slice 1 touches `supabase/`, so no migration behaviour changed; but the certificate pages have not been driven against real seeded rows in this environment, and the rendered screens are the real components with example data. The one behaviour this genuinely leaves unproven locally is the shape of live RLS results feeding the list.

### 4.4 Bounds on the new tests, stated rather than implied.

- `UX1-S0-LANG-01` drives the application's own call sites through a recording client, so it proves what the application **asks for**, not what a live PostgREST receives.
- `UX1-S0-TOKEN-01` reads the source, not the rendered page: it proves no untokenized value is **written**, not that the rendered pixel is correct. The rendered screens are the evidence for the latter.
- `UX1-S1-CERT-ELIGIBLE-01` asserts the binding's predicates and the detail page's branch order over the source. A live ELIGIBLE row has not been rendered here.

---

## 5. Boundary compliance

**No commit in this branch touches `supabase/`, `docs/rebuild/`, `docs/adr/`, `selftest/db/` or `.github/`.** `git status` was checked against those five paths after every stage; `baseline-parity` is green.

**Two changes outside `src/` are worth naming explicitly:**

1. **`selftest/app.test.ts`, one entry added to `ROUTE_INVENTORY`.** This is the only line this session changed in an existing selftest file. It is a coverage list rather than a predicate: `F06-S02` fails until a served static route is in it, and its own failure message says to add it there. Leaving `/belajar/sertifikat` out would have meant a served route nobody scans for internal words — the opposite of the rule's intent. No existing case's logic was altered.

2. **`package.json` / `package-lock.json`: `jsqr` added as a devDependency.** `UX1-S1-QR-01` decodes the symbol the certificate prints and fails unless the text round-trips. A test where the encoder verifies its own output would prove nothing, so the decoder is a different implementation. The QR *encoder* itself (`src/lib/qr.ts`) has no dependency and is in the repository rather than fetched from an image service, because a code drawn elsewhere means a URL carrying a learner's verification token leaves PINTAR every time a certificate is rendered.

Everything else added is new: `src/components/`, `src/lib/{qr,locale,locale-kontrak,lingkup,sertifikat,sertifikat-kontrak}.ts`, `src/app/experience.css`, the two certificate routes, `selftest/experience.test.ts`, `public/fonts/`.

---

## 6. Token set v2 — what changed and why

`--pintar-tokens-version: 2`. The primary is `#245F55`, APPROVED by Yazid on 2026-09-16 and **not frozen**: every value is one line and one edit (Sauron amendment §5).

**Three v1 values failed WCAG 2.1 AA and were replaced.** These are computed, not opinions, and `UX1-S0-CONTRAST-01` recomputes all 34 ratios on every run:

| token | v1 | v2 | the v1 failure |
|---|---|---|---|
| `--ink-3` | `#8A949C` | `#5F6A73` | 2.79:1 on white — unreadable meta text |
| `--status-ok` | `#2E7D5B` | `#2F6E4A` | 4.43:1 on the well, 4.33:1 on its own soft ground |
| `--status-attention` | `#9A6B00` | `#8A5F00` | 4.49:1 on ivory, 4.16:1 on the well |

**One hairline.** `--line: rgba(31,42,51,.12)`, strong `.24`. v1's opaque `#E6E2DA` only sat correctly on ivory. `--line-1` survives as an **alias that resolves to `--line`**, not as a second colour: surfaces UX-1 has not re-set yet still write `border-line-1`, and pointing the old name at the one hairline keeps them drawing a correct border instead of silently losing it. It is deleted when the last v1 surface is re-set.

**Type.** Self-hosted Plus Jakarta Sans (400/600) and IBM Plex Mono (500); the OFL licence for each is committed beside the files in `public/fonts/` (Q-18). No request leaves a reader's browser for a font, so no third party learns who opened a certificate.

**Three display sizes above the ladder** (36 / 40 / 44 px) are named tokens, each for one thing: the verification verdict a stranger reads first, the holder's name on screen, and the holder's name on paper. PROPOSED under Sauron amendment §4 (Daisy retains authority over ordinary typography); named rather than free, so "large" stays a decision somebody made once.

**The root layout no longer caps width.** It previously wrapped every page in `max-w-5xl px-4 py-6`. The cap never bit (every page's own measure is narrower) but the gutter did, and two not-yet-re-set pages relied on it. The gutter is now `--gutter` on `<body>`, and the Experience shell cancels it **by name** (`.pin-shell { margin-inline: calc(var(--gutter) * -1) }`) so its header rule runs edge to edge and can never drift from the padding it undoes. Un-reset pages keep their own measure and padding; they lose 24px of outer vertical padding, which is a foundations consequence and is recorded here rather than left to be noticed.

**The token lint's scope is two declared lists**, not a directory: the surfaces UX-1 has re-set, and the surfaces awaiting their slice with the slice named. `UX1-S0-TOKEN-01` fails if any file under `src/app` or `src/components` is in neither, so a surface added later cannot land outside the lint by accident. 35 implementation constants — A4 geometry, the QR square, a computed proportion, device breakpoints — are classified in an allow-list with one line of reason each, and **a stale allow-list entry whose literal has gone fails the test** (Sauron amendment §3).

---

## 7. Questions for Sauron, classified per bootstrap §10

1. **§4.2** — the replacement certificate's destination. Is the replacement's public verification page the intended action for the "digantikan" banner, or should the reissue lifecycle, when Bob builds it, carry a learner-side read so the holder can see their own replacement in full?
2. **§2.4** — `en-ID` versus `en-GB`. Implemented as the prompt specifies (`en-ID`), with the consequence named. No Slice 1 surface diverges; a report surface will.
3. **§2.2** — `certificate_templates.layout` is unreadable by a learner under its own RLS policy. Implemented with a named fallback and no backend change. Confirming that this is the intended shape would close it.

None of these blocked the slice. All three are reported rather than decided.

---

**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.**
