# Daisy (UX-1) · Session handover, 8 Nov 2026

**Branch:** `ux-1/daisy-experience` (local branch `lane-daisy`; push with `git push origin lane-daisy:ux-1/daisy-experience`).

**This lane is design only.** It never commits to `src/`, the engineering branch, `main`, staging or production.

## 1. Verdict to preserve

**READY for the owner's unscripted walkthrough, on application commit `14361bda`** (`claude/awesome-rubin-bqxp6p`; its `src/` is that of `2be7a796`, «F1–F10: corrections»). The verdict holds only once **that commit is what staging serves**; staging still ran `c4944fab` when this was written. Full report: `CONTOH-LAPORAN/KESIAPAN-AKHIR.md`.

## 2. Status of every item

| Item | Status | Where |
|---|---|---|
| X5-1 … X5-9 (PD Ringkasan Kelas, D-196) | **Verified, closed** | `CONTOH-LAPORAN/KESIAPAN-4.0.md` §1 |
| A1 Class-list import | **Verified, closed** on `14361bda` (live, both paths) | `KESIAPAN-AKHIR.md` |
| A2 Guru → Ringkasan Kelas | **Verified, closed** (live) | `KESIAPAN-AKHIR.md` |
| A3 Lesson table by keyboard | **Verified, closed** (live keyboard on `f2a52a5a`, same code); **screen reader not tested** | `KESIAPAN-AKHIR.md` |
| B1–B6 walkthrough Bs | **Verified, closed** (B5/B6 by component render; the rest live) | `KESIAPAN-AKHIR.md` |
| F1–F10 (my `KESIAPAN-VERIFIKASI.md`) | **Verified, closed.** F8's error path was checked in code only; F10 is a mitigation | `KESIAPAN-AKHIR.md` |
| Staging pass on the promoted commit | **Pending** (blocked until the owner promotes) | §4 below |
| NVDA / TalkBack: A3, B4, B6, C6, plus the disabled «Lanjut ke pemeriksaan» lacking `aria-describedby` | **Not tested** (human work) | `KESIAPAN-AKHIR.md` §6 |
| Studio and Kanonik withdrawals, maintenance confirmations | **Not tested live** (they share `KonfirmasiBahaya`, which was pressed live on /akun) | — |
| W1.16 Studio home count (approved and freezing packages) | **Open engineering defect**, mitigated on screen; needs a migration; the owner should know | — |
| Cosmetic findings (5) | **Open, may follow** | `KESIAPAN-AKHIR.md` §7 |
| Deferred B/C findings (C2, C3, C5, C6, C7, C9, C11, …) | **Open, deferred with reasons** | `KESIAPAN-B-TRIASE.md`, `KESIAPAN-VERIFIKASI.md` §4 |

## 3. Owner decisions and design rulings to keep

**Design grammar**
- X-KONSISTENSI P1–P21, D-172 (K1–K9, S1–S6), D-168, E1, E2.
- The CONTOH-LAPORAN grammar G-01 … G-06 (approved 7 Nov).

**D-196 · X5 (owner, 7 Nov)**
- A PD class gets its own Ringkasan Kelas.
- The owner's sentence is verbatim and is the **scope line** (`pin-intro`): not an alert, and no section letter.
- The natural sentence «{daftar} belum mulai.».
- No percentage in PD results.
- The dash, the mark kept with its word, the compact table, and A4 rows breaking between rows.

**Owner rulings**
- **«Explain once» (owner, 7 Nov):** no repeated «di bawah target» / «Perlu penguatan» under values; one legend per figure; the words as screen-reader text.
- **Section-heading grammar (owner, 7 Nov):** section A's letter and title sit outside its card, like B–D.
- **Readiness (owner, 8 Nov):** every A and the six walkthrough Bs must be resolved before the walkthrough. Routine copy and visual corrections need no escalation; no new scope.

**Still awaiting the owner**
- **C4:** one primary per view (P1) vs D-140 (one per form). My recommendation: D-140 for row lists of the same act, P1 for a page's own next step.
- **W1.16:** the mitigation is acceptable for the walkthrough if the owner is told.

**Awaiting Dr Gladys:** «username» vs «nama pengguna»; «Kursus» on certificates; the lowercase «admin sekolah» copy pass. **Do not invite her team yet.**

## 4. Next session: the precise first action

1. `git fetch origin` and read the head of `claude/awesome-rubin-bqxp6p` and `main`.
2. **If the owner has promoted a candidate to staging,** do the signed-in staging pass. It needs staging access: the `pintar40` cloud environment (created 8 Nov) allows only the GitHub-artifact blob hosts, so add `staging.pintarselalu.com` and its Supabase host, and the `sekolah-uji-*` test accounts as environment secrets.
   - A1, both paths (no class: blocked with the explanation; with a class: through to the done page);
   - B1, as author and reviewer;
   - one report at 390 px.
3. **If the head moved past `14361bda` without promotion,** repeat the local verification (§5) on the new head for the items it touches.

## 5. Evidence and how to rebuild it

**In the repository** (durable): `CONTOH-LAPORAN/verifikasi-14361bda/`
- `jalan-langsung/`: screenshots from the live walk on `14361bda` (Pendataan p1–p6, Aktivasi, Studio s1–s4, reviewer r1–r2; A3 at 390 and 320 px from `f2a52a5a`).
- `render/`: reports rendered from the candidate's components at 1280, 390, 320 px and A4.
- `siap-jalan/`: Second Eye's `audit/siap-jalan.mjs` run on `14361bda` (7/7 PASS), with `ringkasan.json`.
- `alat/`: my walk scripts (`kepala.mjs` sign-in helper + `vF.mjs`, `v6.mjs`, `v7.mjs`, `vC.mjs`), the render harness (`uji/`), the photo, width and axe scripts, the test workbook `buku-tabel.xlsx`, and `app.env.contoh` (the variable names; values come from `supabase status`).

**Rebuild:**
1. In a checkout of the engineering branch: `dockerd &`.
2. `npx supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta`.
3. `next build && next start -p 3999`, with the CI environment from `.github/workflows/audit-journeys.yml`.
4. Run the walks from a folder whose `node_modules` links `playwright` and `@supabase`.
5. If `node_modules` is a symlink, bind-mount it: Turbopack refuses symlinks.

**Run IDs**
- X5 staging walk: `42428273364`, 9/9 PASS on `9a97bb54`.
- Reports staging walk: `42424027157` (`76d75420`).
- Second Eye's CI: `42433800520`, journeys `42433803149` (on `a10d5650`).
- Exact-commit CI on `14361bda`: **not yet reported to me**.

## 6. Reports in this lane, in order

1. `CONTOH-LAPORAN/KESETIAAN.md`: Batch 9 fidelity, rows #1–#28 and X5.
2. `KESIAPAN-4.0.md`: the experience-readiness audit (`e639540b`).
3. `KESIAPAN-B-TRIASE.md`: the triage of the remaining Bs (`5df73a67`).
4. `KESIAPAN-VERIFIKASI.md`: verification of `f2a52a5a` (`7ea99f35`).
5. `KESIAPAN-AKHIR.md`: the final verdict on `14361bda` (`a0581113`).

The patches `X5-koreksi.patch` and `SIAP-A-koreksi.patch` are historical; both are integrated.

## 7. Not preserved

- **The running local stack:** Docker containers, the built app, and the local database rows I created (Kode sekolah «SSA», two learners, one Studio package) live in the session container and will be lost. They are synthetic and reproducible by §5.
- **Earlier exploratory screenshots** in the scratchpad that were superseded by the `14361bda` evidence were not copied.
