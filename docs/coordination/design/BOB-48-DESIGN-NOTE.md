READY FOR REVIEW: BOB-48 design note on 8414df1

# BOB-48 (0): the certificate truth contract, design note

Docs only; nothing here is built. The build of (1) to (4) comes after Gate 6 (BOB-29), per the board. This note unblocks DAISY-36.

Sources read at `8414df1`:
- `20260914103000_certificates_core.sql`: `certificate_eligibility`, `certificate_prepare`, the tables and their triggers;
- `20260914140000_anon_verification_rpc.sql`, the latest `certificate_eligibility`;
- `20260914180000_verification_is_cryptographic.sql`;
- `20260913091500_learning_cycle_scoring.sql` (`session_outcome`);
- `20261010100000_a_lesson_is_assigned_whole.sql`, the cycle's pass mark;
- `src/app/belajar/[tugas]/sertifikat/page.tsx`, `src/app/belajar/[tugas]/hasil/page.tsx` and `src/app/verifikasi/[token]/page.tsx`;
- `KartuSertifikat.tsx` and `src/lib/hle.ts`.

## 1. How (1) to (4) are built

All four follow D-076(e) and D-077(d): **a certificate never silently changes meaning because the application's current state changed.** Each is captured once, at `certificate_prepare`, into the row that is already immutable, and rendered only from there.

**(1) The course, from the sealed release** (Round 1 finding 2).
- **Today:** the certificate page draws the course line from the learner's *current* assignments (`engine.myAssignments(db)`, then `${assignment.subject} · ${assignment.title}`). An assignment that has ended, or been moved, changes or loses it.
- **Build:** `certificate_prepare` already reads the session's `plp_release_id` and `release_content_sha256` into the signed payload. It will also read that release's course (`plp_releases → courses`: subject and title as they stand in the sealed release) into a new snapshot field, `course_as_issued`, on `certificate_identity_snapshots`.
  - That table is immutable, so `enforce_snapshot_immutable` covers the field.
  - The page and the verification read render that field only.
- **Not in the signed payload,** so existing signatures and verification are untouched. The payload already pins the release by id and hash, from which the course is derived.
- **Existing certificates:** their field is empty, and they render the course derived from their own `plp_release_id`, the same sealed source, never current assignments. Nothing is backfilled or rewritten.

**(2) The issuing school's name, captured at issuance** (finding 3).
- **Today** it is read live (`institutionNames([row.institution_id])`), so a rename rewrites every certificate the school ever issued.
- **Build:** a snapshot field, `institution_name_as_issued`, filled in `certificate_prepare` from `institutions.name`, immutable with the rest of the snapshot.
- The page and the public verification read it. The live name stays only for the school's own admin screens.
- **Existing certificates:** the field is empty, so they keep showing the current name. The hand-off will name this as the one remaining live read, for pre-BOB-48 rows only. No row is rewritten, and I propose no backfill: backfilling a live value into a sealed row would be exactly the rewrite (e) forbids.

**(3) One language, fixed at issuance: Bahasa Indonesia** (as for the card, D-074).
- **Today** the certificate renders in the reader's current locale (`currentLocale()` → `t(..., { locale })`), so the same certificate reads differently to two people.
- **Build:**
  - `certificate_prepare` records `lang_as_issued = 'id'`.
  - The certificate and its verification render in that language, whatever the viewer's locale. The surrounding page chrome (navigation, back link) stays in the viewer's locale; only the credential itself is fixed.
  - The fixed words (predikat, «Sertifikat Penguasaan», the field labels) are Daisy's keys, rendered with `locale: 'id'`.
  - `predikat` is stored as issued in the signed payload already («Cukup», «Baik»…), which is Bahasa Indonesia by construction.

**(4) Eligibility (D-078(b)): «Perlu Pendampingan» is not certificate-eligible.**
- **Today** `certificate_eligibility` makes a session eligible when the mode certifies, the evidence is OFFICIAL, the safety gate passed and `mastery >= passing_rules.mastery_min`. The predikat is computed beside it from `scoring_policy.predikat_bands` and does not take part in the decision.
- **The canonical grade semantics are the bands** on the session's own `scoring_policy` row: ≥ 0.90 «Sangat Baik», ≥ 0.80 «Baik», ≥ 0.70 «Cukup», ≥ 0.00 «Perlu Pendampingan».
- **The build derives eligibility from which band the result falls in, never from a number in certificate code.** The band has to say whether it is a mastery band.
- **`scoring_policy` rows are immutable** (`scoring_policy_write`, 20260914091500:141), so a flag cannot be added to `pintar-scoring/1`'s bands in place. Two ways:
  - **(A) a reviewed reference table `predikat_semantics (predikat text primary key, is_mastery boolean, why text)`:** «Sangat Baik», «Baik» and «Cukup» are mastery bands; «Perlu Pendampingan» is not.
    - `certificate_eligibility` refuses when the result's band is not a mastery band, with reason `PREDIKAT_NOT_MASTERY`.
    - A closure check fails the migration, and a test, if any band label in any `scoring_policy` row has no meaning row. So a future policy cannot add a band that certificate code guesses about.
  - **(B)** a new scoring policy version, `pintar-scoring/2`, whose bands carry `is_mastery`. This changes what is stamped on every new session: an engine-level move out of proportion to a certificate rule.
- **I propose (A).** It adds meaning without rewriting a policy or restamping evidence. There is still one definition of the bands (`predikat_bands`) and one reading of which are mastery.
- **Not built:** no `>= 0.70` anywhere in certificate code. A test will assert the certificate functions name no mastery constant.

## 2. Where a learner or teacher is told they "passed"

- **(a) The learner's result page** (`/belajar/<tugas>/hasil`). It shows the mastery percentage and «Target untuk bab ini: 60%.» (`siklus.ambang`, from `session_outcome().ambang` = `passing_rules.mastery_min`). It never says «lulus», but meeting the stated target reads as passing.
- **(b) The learner's certificate page** (`/belajar/<tugas>/sertifikat`). `passed = session_outcome().lulus` (mastery ≥ `mastery_min` and the safety gate). A passed session with no sealed certificate is **issued one on load** (V-6a). While it is being prepared, «Hasil Uji Penguasaan Anda sudah memenuhi syarat» (`sertifikat.disiapkan.arti`).
- **(c) The public verification page** (`/verifikasi/<token>`). `pass` from the signed payload's `result.passed` is shown as «Memenuhi capaian» or «Belum memenuhi capaian» (`verifikasi.lulus` / `verifikasi.belum_lulus`), beside the predikat.
- **(d) The learner's certificate card** (`KartuSertifikat`): the predikat as issued.
- **(e) The teacher's instrument list:** «Diterbitkan sekolah bila murid memenuhi capaian» (`mengajar.instrumen.sertifikat.arti`).
- **Nowhere** is «tuntas» shown.

**FOR YAZID: someone can be told they passed yet be refused a certificate.**
- Every cycle Uji Penguasaan is created with `passing_rules = {"mastery_min": 0.6}` (20261010100000:127), and so are the seeds and every Uji Cepat.
- A learner at **0.60 to 0.69** is today **passed** (`lulus` true), shown «Target … 60%» met, told «sudah memenuhi syarat», **issued a Sertifikat Penguasaan** with `pass` «Memenuhi capaian», and given the predikat **«Perlu Pendampingan»**.
- D-078 removes the certificate. Unless something else moves, that learner is still told (a) and (b) they met the target, while being refused the certificate and shown «Perlu Pendampingan». The ticket asks for exactly that contradiction to be flagged.
- Yazid chooses one:
  1. **Raise the cycle's pass mark to 0.70** (the start of «Cukup»). Then "passed" and "certificate-eligible" coincide, and there is one definition of mastery. This changes what "lulus" means for new cycle definitions: an engine- and catalogue-relevant change (D-060), with its own migration and bump. Existing definitions keep 0.6.
  2. **Keep 0.6 as the target, and word (a), (b) and (e) so that meeting it is not called passing** (for example, "target reached; certificate from «Cukup»"). This is Daisy's copy and D-068's terms. The certificate page gets DAISY-36's non-certificate state.
  3. Something else he prefers.
- **Also note:** the verification page's `pass` for certificates already issued to learners at 0.60 to 0.69 stays «Memenuhi capaian» with «Perlu Pendampingan». Those rows are never rewritten (D-077(5), INV-30).

## 3. D-076(c): confirmation only, no build

**The number `<PINTAR ID>/<5-digit per-person sequence>`, for example `A14CD7ST/00001`: confirmed as buildable, with these contracts.**
- **Uniqueness and permanence of the prefix:** confirmed. `persons.pintar_id` has a unique index and is immutable (`PINTAR_ID_IMMUTABLE`), and persons are never deleted (BOB-24).
- **The sequence and its concurrency:**
  - A per-person counter row, taken with `SELECT … FOR UPDATE` inside `certificate_prepare`, so two certificates for one person sealed at the same moment take 1 and 2, never both 1.
  - The existing unique index on `certificate_number` is the backstop.
  - A number is never reused: the counter only rises, and certificates are never deleted.
  - Today's number takes `count(*) + 1` per institution without a lock, so two concurrent issuances in one school collide on the unique index and the second fails outright. The per-person lock also removes that.
- **The signed record:** `certificate_number` is inside the signed canonical payload (§7).
  - New certificates carry the new form.
  - Existing certificates keep `PINTAR/<SLUG>/<YYYY>/<nnnnn>` and verify exactly as before, because their payloads are immutable and never re-signed.
  - The number stays a label, never a lookup key: verification is by token.
- **The year:** the new form has none, so (5)'s time-zone observation does not arise. If Yazid keeps a year, it follows the printed date's zone (Asia/Jakarta).
- **FOR YAZID (already open in D-076):** whether a **student's** academic certificate may show their PINTAR ID (C17, since students have no PINTAR ID screen). If not, a student's number needs another stable prefix.

**The short link `https://verifikasi.pintarselalu.com/<token>`: confirmed as buildable within INV-38.**
- **The token:**
  - I propose **16 Crockford Base32 characters (80 bits)**, drawn from `gen_random_bytes`, above the 12-character (60-bit) floor. It is short enough to print and type.
    - The verification route has no rate limit today, so the token's own entropy is the only guard against enumeration.
    - At 80 bits, guessing a live token is out of reach without a limit; 60 bits would lean on one.
  - It is case-insensitive on input, and O, I and L are read as 0, 1 and 1, as `pintar_id_canonical` reads a PINTAR ID.
  - It is separate from the number and derived from nothing.
- **The schema:** `certificates.verification_token` is unique with `length >= 43` (today's base64url tokens).
  - The build relaxes the check to "either today's form or the new form" for new rows. Existing tokens and their links keep working unchanged.
  - The token is not in the signed payload, so no signature changes.
- **One route (INV-38):**
  - The new host serves the **same** route handler, `/verifikasi/<token>` and `/api/verifikasi/<token>`, through a host-based rewrite in the proxy. There is no second verification implementation.
  - The public-surface registry gains the host as a declared anonymous surface; the path prefixes are already registered.
  - The app origin's `/verifikasi/<token>` keeps working for links already printed.
- **Production change (D-039):** the `verifikasi` DNS record and the Vercel domain are Yazid's. The build is ready without them and switches on when they exist.

## 4. The D-060 position

- **Metric catalogue: unchanged by (1) to (4).**
  - No `calc_*` body, no metric source view (`academic_certificates` included) and no readiness rule changes.
  - (4) changes which certificates are **issued from now on**, not how issued certificates are counted. `institution.verified_credentials` keeps its meaning, «issued and unrevoked credentials».
  - Past rows are untouched.
  - I will state this again in the build's hand-off, and bump if the coordinator reads the eligibility change as a change of what the metric counts.
- **Engine: unchanged by (1) to (4).** Eligibility is not grading, assembly or finalization, and the predikat bands and the scoring policy are not changed.
- **If Yazid chooses §2's option 1** (a 0.70 pass mark), that one is a grading-meaning change for new definitions and is stated separately when built.

## 5. What the build's tests will prove (from the board row)

- (1) to (4), each red on today's code, then green.
- A certificate issued before a school rename and before its assignment ends still reads the old school and its course.
- A «Perlu Pendampingan» result gets no certificate; a «Cukup» or better does.
- Issued certificates are never rewritten (rows hashed before and after).
- The certificate, verification and F-series suites stay green.
