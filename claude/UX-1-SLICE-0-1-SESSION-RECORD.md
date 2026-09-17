# UX-1 SLICE 0 + SLICE 1 — IMPLEMENTATION SESSION RECORD

**Session:** Daisy (Claude Code), 2026-09-16 · **Branch:** `ux-1/daisy-experience` off `9b2cc5d1075f21b3d1f61a32a83ba1b07d25a3ba` · **PR:** yazidmanan2409/pintar40#2 (draft) · **Ended at:** the Slice 1 STOP, paused for Yazid/Sauron visual review.

This is the execution log. It is not the handoff — `claude/UX-1-SLICE-0-1-SECOND-EYE-HANDOFF.md` is the verification artefact and carries the nine return criteria, the column list and the bounds. **This document records how the work was actually done**, so that a later session (a visual-adjustment round, Second Eye, or Bob picking up the issuance gap) does not have to re-derive any of it.

---

## 1. What the environment could and could not do

Recorded because three decisions below follow directly from it, and because the next session will meet the same container.

| | |
|---|---|
| **Frozen baseline** | `9b2cc5d` is **ahead of `main`** (`main` = `8106de3`, 70 migrations; `9b2cc5d` = 83). `main` is an ancestor of it. `claude/quirky-meitner-a04smj` points exactly at `9b2cc5d`, which is why the PR is based there — basing on `main` would have put 13 Core commits in the diff. |
| **The `claude/` documents** | `claude/DAISY-UX-1-SLICE-0-EXECUTION-PROMPT.md` and every `claude/UX-0-*` referenced by it **do not exist in the repository, at any commit.** The prompt was supplied in full in the session message and was treated as authoritative; the glossary and design direction were reconstructed from it plus the repository. The first two files this branch adds to `claude/` are the handoff and this record. |
| **Postgres** | `psql` and Postgres 16 present. **The local Supabase stack cannot start**: `docker` is installed, `dockerd` starts under `sudo -n`, but `ghcr.io` image blobs answer `403 Forbidden` through the agent proxy. So the `db` facility was absent for the whole session. |
| **Environment variables** | None. The selftest runner adds the `app` facility unconditionally and boots a production build, so every route 500'd. Fixed with an untracked `.env.local` carrying the same placeholders `.github/workflows/ci.yml` gives its selftest job. |
| **Chromium** | Pre-installed at `/opt/pw-browsers/chromium` (build 1194). A freshly installed `playwright` wants build 1243 and fails; launch with `executablePath: "/opt/pw-browsers/chromium"`. |
| **Google Fonts** | Reachable. `fonts.googleapis.com` returns `.ttf` to a default UA and `.woff2` only to a browser UA — pass a Chrome User-Agent when fetching the CSS. |

---

## 2. Preflight, and the three baseline failures

```
git rev-parse HEAD              → 9b2cc5d…    ✓
ls supabase/migrations | wc -l  → 83          ✓
git status --porcelain | wc -l  → 0           ✓
npm ci                          → 395 packages
npm run typecheck               → clean
npm run selftest:local          → 25 passed, 3 failed, 59 skipped → RED
node scripts/baseline-parity.mjs → OK
```

`F01-R01`, `F05-R01`, `F06-R01` failed. **Diagnosed before anything was edited.** All three are route tests; all routes returned 500 including `/` and `/masuk`, which is the signature of an app that cannot construct its Supabase client, not of a Core defect. With `.env.local` provisioned: **28 passed, 0 failed, 0 contract problems.** CI run 81 on `9b2cc5d` itself is green, which confirms it independently.

`RED` is the correct local verdict at any commit: 59 db cases carry no `skip_justification`, so `--accept-justified-skips` cannot accept them. **Locally, the number to read is `0 failed, 0 contract problems`.**

---

## 3. Decisions taken, and why

Each of these was a fork where the prompt did not dictate the answer. Recorded so they can be reversed knowingly rather than rediscovered.

**The HLE row shape is flat (`default`/`en`, `learner`/`en_learner`), not nested.** `F05-S03` and `QAC-S01` parse the copy table with a regular expression that cannot cross a closing brace. A nested `{ id, en }` row would have silently emptied their scan — a copy rule that scans nothing reads green while enforcing nothing. Cost: slightly uglier rows. Worth it.

**Glossary keys were reused, not renamed.** `role.*`, `cycle.*`, `map.tier.*` and `kesiapan.*` already existed for what UX-0-08 §5 calls `peran.*`, `siklus.*`, `peta.tingkat.*` and `kesiapan.*`. The prompt says a rename is a migration, so nothing was renamed.

**The component class prefix is `pin-`, not `px-`.** `px-` was written first and collides head-on with Tailwind's horizontal-padding utility, which would have made the token lint unable to tell `px-col` from `px-4`. Renamed before the lint was written.

**The root layout stopped capping width.** It wrapped every page in `max-w-5xl px-4 py-6`. The cap never bit; the gutter did, and `src/app/page.tsx` and the Studio refusal branch had no gutter of their own. So the gutter became `--gutter` on `<body>`, and `.pin-shell` cancels it **by name** so the shell header can run edge to edge without a magic number that could drift.

**Three display sizes (36/40/44) above the type ladder**, each named for one thing. PROPOSED under Sauron amendment §4. The alternative — forcing the certificate's holder name into the 30px page-title step — would have made the credential read like a heading.

**The token lint's scope is two declared lists, not a directory.** A lint over all of `src/` would fail on surfaces this slice may not touch; a lint over "files I changed" stops covering anything the moment nobody changes files. Two lists, and a file in neither fails the test.

**The QR encoder is in the repository.** A code fetched from an image service means a URL carrying a learner's verification token leaves PINTAR on every render. Consequence: `jsqr` as a devDependency, because an encoder that verifies its own output proves nothing.

**The "digantikan" action opens the replacement's verification page.** Not a preference — the only destination the contract reaches. See §5.

---

## 4. Dead ends, recorded so they are not retried

**The local Supabase stack.** Two attempts. The daemon can be started; the images cannot be pulled. Do not spend time on it in this container — use CI for the `db` facility.

**Two real QR bugs, invisible without a decoder.** The first implementation produced symbols no decoder would read. Root causes: (1) the version-information BCH generator was written as `0b1111100100`, a ten-bit truncation of the correct thirteen-bit `0x1F25`; (2) the data walk derived its up/down direction from the column index parity, which desynchronises at the column-6 skip. Both were found by round-tripping through jsQR, not by reading the code — which is the entire argument for `UX1-S1-QR-01` existing.

**`src/lib/sertifikat.ts` and `src/lib/locale.ts` both had to be split.** The first because `server-only` cannot be imported by the tsx test runner; the second because a client component needed the cookie name and would have pulled `next/headers` into the browser bundle. Both splits follow the pattern `src/lib/certificates/verification.ts` already documents. **If you add a constant a client component or a test needs, put it in a `-kontrak` module from the start.**

---

## 5. Open threads, in priority order

0. **Q-7 now carries a ruling, not just a gap.** `claude/UX-1-INSTITUTION-MARK-RULING.md`
   (Yazid/Sauron, 2026-09-17) specifies the institution-mark behaviour the Experience owes:
   an institution replaces the mark in the application shell **and nothing else**, and the
   credential's issuer identity stays a separate concern permanently. Nothing is implemented
   — the frozen contract has neither the column nor a public delivery path — and
   `UX1-BRAND-02` fails the day either appears, so the gap is closed deliberately rather
   than by whoever adds the obvious column.

1. **A replacement certificate has no learner-side detail read.** Nothing in the frozen schema ever writes a non-null `supersedes_certificate_id` — there is no reissue function at all — and by the definition in `certificates_one_root_per_session` a replacement is the root of no session, so `my_certificate` (per-session, root-only) can never return it. The banner therefore opens the replacement's public verification page. **Belongs with V-6a as Bob's**, not as a UX-1 change. Handoff §4.2, §7.1.
2. **End-to-end issuance: PENDING Bob's lifecycle step.** ELIGIBLE is the state a learner meets by default today.
3. **`en-ID` yields English months with Indonesian digit grouping.** Invisible on every Slice 1 surface; visible the first time a report renders a separated number. Handoff §7.2.
4. **`certificate_templates` is `CAN_PUBLISH`-gated**, so a learner never reads a layout row; a named `CLASSIC` fallback is used and no backend change is proposed. Handoff §7.3.

---

## 6. How to pick this up

```bash
git fetch origin && git checkout ux-1/daisy-experience
npm ci
cat > .env.local <<'ENV'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder-anon-key
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3999
SUPABASE_SERVICE_ROLE_KEY=local-placeholder-service-role-key
CARD_PEPPER=synthetic-card-pepper-fable01-32plus
CARD_EMAIL_DOMAIN=cards.synthetic.pintar.test
CERT_SECRET_KEY_V1=synthetic-certificate-key-fable04-32plus
SELFTEST_APP_PORT=3999
ENV
```

Then the four checks this session ran before every push — **all four must be clean before pushing, because a push that turns CI red costs a cycle:**

```bash
npm run typecheck
npx eslint src selftest --max-warnings=0
npm run selftest:local        # expect: 35 passed, 0 failed, 0 contract problems (RED verdict is structural)
node scripts/baseline-parity.mjs
```

To re-render the review screens after a visual adjustment, see `claude/tools/render-screens/README.md`.

**The boundary, which did not move and must not:** no commit may touch `supabase/`, `docs/rebuild/`, `docs/adr/`, `selftest/db/` or `.github/`. Check it with:

```bash
git diff --name-only 9b2cc5d..HEAD | grep -E '^(supabase|docs/rebuild|docs/adr|selftest/db|\.github)/'
```

**Slice 2 is not authorized.** The STOP at the end of Slice 1 stands until Sauron lifts it.

---

## 7. Final state at the pause

| | |
|---|---|
| Head | `50cdf89`, pushed to `ux-1/daisy-experience` and `claude/sleepy-fermat-hbmuxl` |
| PR | #2, draft, `mergeable_state: clean`, no review threads |
| CI | run 35105445157 — **16/16 jobs green**; selftest **181 passed, 0 failed, 0 skipped, 0 contract problems → GREEN** |
| Screens | https://claude.ai/artifact/TpKYLxvxn9H52qxbGrS3ad — 12 screens × 2 languages × 2 widths |
| Boundary | clean across all 9 commits |
| Manifest | v29 + 7 = 181 ids |

**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.**
