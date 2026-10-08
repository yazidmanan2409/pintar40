# L3 criteria audit: 886554b → 36c89dd (read-only)

Scope: `git diff 886554b 36c89dd -- audit selftest scripts/recovery` (30 files). New tests (fable22.*, konteks-uji.ts, PENUTUPAN-L01, L3D, L3A) are reviewed only where they bear on authority. Rulings were read in docs/coordination/DECISIONS.md (D-123, D-127 to D-132) and in the L3 design page.

## 1. Changed criteria

| # | Criterion (file:line @36c89dd) | Old → new | Ruling cited / does it say so? | Verdict |
|---|---|---|---|---|
| 1 | **C12k** audit/c12.mjs:708 | `C.mendarat_guru !== "/mengajar"` → `C.mendarat_guru !== "/"`. Kelas 1A must still open from /mengajar (`!tab`), display role EDUCATOR, `satuOrang "1\|1\|1\|0"` | "RESTATED BY D-132 C9". D-132(i): «No door and several: the chooser». F22-K01: «an enrolled Guru, both» (Mengajar + Belajar). **Yes.** Caveats: (a) commit f9ec4ff changed this criterion *after* the run where it failed (L3 report §5: «C12k … was fixed after this run»). (b) The C-12 acceptance text still says «home `/mengajar`» (docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md:703, P1), and D-132 does not name this enrolled-Guru case. (c) C12k no longer checks that choosing Mengajar lands on /mengajar, because `keKonteks`'s return value is ignored. L3D and BD11 check that instead | RESTATED-WITH-AUTHORITY (needs the owner to note P1) |
| 2 | **BD11** journey.mjs:3953–4010 | Old: the teacher's home was only recorded (`catat.unshift(\`teacher's home …\`)`), with no assertion. New: FAIL when the admin's sessions stay open or keep a context (`sisa !== "0"`). FAIL when the chooser is reached with a context already set, fewer than 2 doors, or a MENGELOLA door. FAIL unless `(/mengajar && MENGAJAR:sd-zps) \|\| (/belajar && BELAJAR:-)`. The Back-leak checks are unchanged | D-132(e), §2.8 and §2.9; C9. **Yes** | STRENGTHENED |
| 3 | **S2** journey.mjs:360 | `!toStudio` → FAIL becomes `toStudio` → FAIL. Konfigurasi in «Seluruh platform» must *not* link Studio | "RESTATED FOR L3 (D-132 C7)". C7 lists only these platform views: «system checks, platform maintenance, the platform's audit, every school's problem reports, activation across schools, Keamanan, email». Design §4 says «Pustaka PINTAR → Studio». C8: «Studio follows purpose and place». **Yes, by enumeration.** No ruling says this in so many words | RESTATED-WITH-AUTHORITY |
| 4 | **S15b** journey.mjs:826–844 | Old: the library is offered `kali === 1`, last, not preselected. New: in Mengelola · SD the picker is exactly 1 option and holds 0 library entries. In Pustaka it is exactly 1 option, the library. The canonical course count is unchanged. NOTE only when both pickers are empty | "RESTATED FOR L3 (D-132 C7, C8)". C7: «Pustaka PINTAR … a place of its own». Design §2.6: a surface «shows the context place only». **Yes.** «Never preselected» becomes «never offered until chosen» | RESTATED-WITH-AUTHORITY (tighter: exact lengths) |
| 5 | **S7b** journey.mjs:466–477 | The assertion is unchanged. The setup now picks Mengelola · SD and waits for the panel. The old question, which school a context-free platform admin sees first, cannot arise now, and the Pustaka-context structure is not walked | C7; design §2.5 («`?sekolah=` stops choosing a school: the context does»). **Yes** | RESTATED-WITH-AUTHORITY (some coverage moved to DAISY-05-STRUKTUR-02) |
| 6 | **S23i, S23q** journey.mjs:2386, 2947 | Only setup: `keKonteks(MENGELOLA, SD Zayd)` before Studio. Verdict logic is unchanged | C4, C8. **Yes** | RESTATED |
| 7 | **S23r** journey.mjs:2521–2524 | `lagi > 0` → `lagi > 0 \|\| !diHalaman`. Being sent away from /studio/integritas now fails, so the check can no longer pass vacuously | C4 | STRENGTHENED |
| 8 | **L3A setup** journey.mjs:4126–4143 (new step) | Operator SQL: SMA `namespace='SMZ'` and `issue_institutional_id` for Gladys. Grants go through `grant_role` with each school admin's own session. A setup failure gives **BLOCKED**, which is red | Declared «SETUP (OPERATOR, declared, as W1)». The W1 operator step has precedent in 886554b:491. The PASS criteria (two devices, two contexts, `lanjut=/konfigurasi`, sessions `MENGAJAR:sma-zps` + `MENGELOLA:PLATFORM`) match design §3 and D-132(l) | New, acceptable |
| 9 | **UX1-AJAR-BELAJAR-01** app.test.ts:1113–1237; manifest | Old: the header had «Pembelajaran Saya» and `href="/belajar"`; the learning page had to link `/mengajar` and show the Kelas tab. New: the nav links `/` with entry.title; no `/belajar` tab; chooser doors exactly `[BELAJAR, MENGAJAR]`; the learning page has the chooser and no `/mengajar` tab; certificates require the chooser link, not Kelas. The enrolment and «nobody became a student» proofs are untouched | "RESTATED FOR L3 (D-132 C1, C3, §2.4)". C3: «no separate role, school or workspace switcher». §2.4: «There is no switch anywhere else». **Yes** | RESTATED-WITH-AUTHORITY |
| 10 | **BOB06-R01** app.test.ts:696–731 | HOD `/pimpinan` → `/`; sysadmin `/konfigurasi` → `/`. The route must pass through `/mulai`. The dean and the single-pair roles are unchanged | C9; design §4. **Yes** | RESTATED-WITH-AUTHORITY |
| 11 | **BOB20-A01** app.test.ts:2943–2946 | Adds a check: two schools held → `/konfigurasi?sekolah=S` answers 307 to `/?lanjut=` | C4 guard. **Yes** | STRENGTHENED |
| 12 | **BOB26-A01 / BOB27-A01 / BOB12-A01** | `tujuan === "/mengajar"` (or `/belajar`) → `tujuan === "/mulai"` (or `/mulai?lanjut=%2Fmengajar`), **and** /mulai's redirect must land on /mengajar (or /belajar) | C4, C9, C6. The end state is the same | RESTATED |
| 13 | **BOB28/29, D101-A, DR150C, PENUTUPAN-A01, F09-C02, BOB51-A01, DAISY-06-TERBIT-02, BOB18/19-A01** | Only setup: `pilihKonteks*` before the act. BOB18-A01 adds `konteks_saya ≤2, konteks_tempat_saya ≤1` | C7 / C8 | RESTATED (BOB18: STRENGTHENED) |
| 14 | **DAISY-03-TEMPAT-01** experience.test.ts:7943ff; manifest | **Deleted:** the pure sweep of `pintuMasuk` over every display role × roles answer, including «a student is never sent to /mengajar» and «an unreadable roles answer opens no staff door». `pintuMasuk` no longer exists in src. **Replaced by:** source pins (`pintuPilihan(tempat, minta)`, 0 `<Link>`, 1 `<form>`), anonymous doors `/masuk?pintu=…`, and labels by purpose. The shell check now requires *both* `navKonteks` and `TabTempat` (`keduanya`). Studio's check is looser: `navKonteks\(\{` only | C3; the manifest points to F22-P01/P04/K01. **Mostly.** `tempatSaya` fails closed (`error ? [] : …`, konteks-server.ts:42), but I found no test that pins this, so the «unreadable answer» property lost its explicit test | RESTATED-WITH-AUTHORITY (one small gap in what is proved) |
| 15 | **DAISY-05-STRUKTUR-02 / -01** | The sysadmin now runs in Alpha's context with the same assertions. **Added:** «Seluruh platform» draws or offers no structure. The static regex now uses `sekolahIni` / `(lama && isSys)` | C7. **Yes** | RESTATED + STRENGTHENED |
| 16 | **DAISY-06-UNGGAH-02 / -01** | SYSTEM_ADMIN expectation `(null, pustaka true)` → `("Sekolah Sintetis Alpha", false)` in Alpha's context. **Added:** Pustaka context offers exactly `[kanon]`. Static: the library only to `operator` (Admin platform with SYSTEM_ADMIN in this context) | "RESTATED FOR L3 (D-132 C7, C8)". **Yes** | RESTATED-WITH-AUTHORITY |
| 17 | **DAISY-11-STUDIO-01** experience.test.ts:9500ff | `studio={studio}` on each shell → `navKonteks` on each shell. `<TabTempat studio>` is still required for pengajar/pendataan but no longer for pimpinan. **Added:** a NavKonteks pin `studio={tawarkanStudio(peran) && …}` + `permukaanKonteks(k)` | C8, §2.4. **Yes**. The pimpinan fallback now lives in NavKonteks, which is pinned | RESTATED |
| 18 | **F22-P02 Dean row** fable22.test.ts:322 (new) | Mengelola · Dekan serves `/edukator,/pimpinan,/dekan,/akun`, without `/studio`; home `/pimpinan` | D-021: the Studio tab is for «Guru, Kepala departemen, Admin sekolah and Admin platform». In 886554b, DAISY-11-STUDIO-02 already proved «the dean's /pimpinan carries no link to /studio». **Consistent; not a change** | RESTATED (consistent with canon) |
| 19 | **Source-pin renames**: BOB15-S01, BOB51-S01, D101-S01, M148-S01, D006-K01, EFF-K02, BOB19-K01, POLISH2-ADMIN-01, PENUTUPAN-T01/J01/P01, UX1-MASUK-TUJUAN-01, DAISY-18-DENGAR-01 | `isSys`/`adminInstitutionIds` → `platformIni`/`sekolahIni` (persona `lama` kept, C10). EFF-K02 re-pins both reads. DAISY-18 exempts a layout that only awaits `konteksHalaman()` (exact regex) | C7, C10, §2.6. BOB19-K01 also pins `adminPlatformDiSekolah`: Admin platform in Mengelola · school still asks the *platform's* «awaiting first role» list (J1.4). C7 puts «activation across schools» in «Seluruh platform». **This is product behaviour that no ruling covers explicitly** | RESTATED; BOB19-K01's new product behaviour: UNCLEAR (owner may confirm) |
| 20 | **UX1-BRAND-02, UX1-TUR-ORANG-01** | Migration baseline `176` → `177`, justified by the migration's contents | Normal «MOVED» practice | RESTATED |
| 21 | **Staging** G1, O4, A8, L2, U2a | G1 `/konfigurasi` → `/`. O4 `at === "/"`, then «Seluruh platform» → `/konfigurasi`. **A8** «any non-/masuk landing» → must be `/` then `/pimpinan`. L2 `/pimpinan` → `/` then `/pimpinan` | C9, C7 | RESTATED (A8 STRENGTHENED) |
| 22 | **Recovery F1** functional.mjs:81–121 | Follows at most 3 of the app's own redirects, never to /masuk. On `/`, it posts «Seluruh platform» or the single door; several doors with no platform door → `ok:false`. The page must still be 200 and must not be /masuk | C3, C4, C9 | RESTATED (not weakened) |

## 2. Deleted, skipped, non-fatal or reclassified checks

- **No FAIL or BLOCKED → NOTE or PASS reclassification.** A grep of every `verdict` and `NOTE` line in the journey diff finds only: S2's inversion (#3), S15b's NOTE condition (narrowed to «both pickers empty»; any other gap is FAIL), the S23r addition, and new FAIL/BLOCKED lines in BD11, L3D and L3A.
- `step()` (journey.mjs:45–57) still turns any thrown error into FAIL. When `keKonteks` / `pilihKonteks` find ≠1 matching door they *throw*, so a missing door goes red rather than being skipped.
- The new `.catch(() => {})` calls wrap only `waitFor` / `waitForURL`. A PASS assertion follows each of them.
- One real deletion: the `pintuMasuk` sweep (#14), which goes with the deleted function.
- No `skip` / `skip_justification` was added to any changed test in manifest.json.

## 3. S23q / CR-52

- S23q is unchanged apart from choosing the context: `if (kurang.length) rec.verdict = "FAIL"` still stands, so it stays a FAIL in the journey.
- How it is documented:
  - D-123(1): «CR-52 → A, Daisy S7 + engineering».
  - D-130(e): «S23q / CR-52: a known outstanding item, not an L2 regression».
  - CLOSURE-REGISTER lines 73, 80, 116, 130, 138, 238.
  - L3 report §5: «Job B: 75 PASS, 1 FAIL. The FAIL is S23q, CR-52's A item, failing exactly as QN5 words it (D-123)».
- It was not downgraded.

## 4. audit/crawl.mjs

- **Unchanged:** the broken predicate (`errorPage || status >= 500 || error || PAGEERROR`, line 268), W9 (274) and **X.6 320 px** (277–280).
- **Added:**
  - Gate 6: the crawl answers «Komputer siapa ini?», so it now reads the screens behind it.
  - The persona picks a chooser door (`?? kunci[0]` fallback).
  - GitHub annotations.
- The L3 report states that the crawl came out *redder* (147 X.6), and it did not relax anything.
- **Coverage note:** each persona walks one context only. Other contexts' pages now land on the chooser with 200 and are not reported as broken.
- **«404» → `\b404\b`:**
  - The Next.js framework page renders «404» as its own token next to «This page could not be found». The literal phrase in the same regex, and the standalone «404», both still match.
  - PINTAR's own not-found page (`src/app/not-found.tsx`, copy key `tidak_ada.*`) never matched «404» in either version.
  - The only matches dropped are «404» glued to word characters (e.g. `…6102404a13d3`, `E404`).
  - **It cannot hide the Next.js not-found page.**

## Overall verdict

I found **no criterion weakened without authority.** Every changed expected landing, assertion and PASS condition is one of three things: setup that picks the context; a restatement that cites D-132 C3, C4, C7, C8 or C9 and that the recorded ruling text supports; or a stronger check (BD11, S23r, BOB20-A01, BOB18-A01, DAISY-05-STRUKTUR-02, staging A8). No FAIL or BLOCKED was reclassified, no check was made non-fatal, and S23q/CR-52 remains a documented FAIL under D-123. The crawl relaxes nothing that counts as broken, and the «404» word boundary cannot hide the framework's not-found page.

Four items should go to the owner or Second Eye for acknowledgement rather than counting as violations:

1. C12k's arrival criterion was rewritten after it went red. D-132 C9 supports it, but the C-12 P1 text («home `/mengajar`», EDUCATOR-AS-LEARNER-TICKETS.md:703) was left unamended.
2. S2's Studio-link inversion rests on C7's list of views, not on an explicit sentence.
3. The deleted `pintuMasuk` sweep left the «unreadable answer opens no door» property without a test that pins it (the code fails closed).
4. BOB19-K01 pins a new behaviour no ruling covers explicitly: Admin platform in a school context still reads the platform-wide «awaiting first role» list.
