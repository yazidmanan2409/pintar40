# Second Eye · resumption record for the long-weekend pause (26 Nov 2026)

**The owner's instruction (26 Nov):** pause for the long weekend. No development, merges or deployments, and staging and production stay untouched. Resume only on the owner's instruction. This record covers the Second Eye stream only. The plan of record is Bob's.

## Where things stand
- **main:** `2c96bdd291aee9d8df0c39cb3737cace839b04dc` (PR #34, Agent Skills). Its ci, 45779343510, was `in_progress` when read from the API at about 08:2xZ on 26 Nov. **Bob owns its verification and closure.**
- **CI-1b: CLOSED** (ruling 104). It was merged as main `b9ca98ef`, and main's ci 45774017397 concluded success at 07:50:09Z.
  - `claude/ci-1b` = `5cd81f9d`, frozen and reviewed.
  - `claude/ci-1b-evidence` = `1f2689d4`, Daisy's print renders.
- **CI-1b items carried to AR-79** (Sharon, CI-1B-PREREVIEW FINAL ledger). None are started.
  - The unknown-review banner on screen (AR-A).
  - The non-PDF fail-closed sweep.
  - `journey.mjs`'s 65 waits.
  - The static check that the certificate's print parts render only on the certificate page. A local draft exists only in the stopped container; it is **not pushed**, so rebuild it.
  - F04-S04 (a harness DDL vs pg_cron deadlock).
  - CI-W54322 (COMMON-CAUSES §9 `a0bbc3bb`).
- **Not started, and nothing built:** AR-79 batch AR-A. Its local branch `ar79/ar-a` had no commits and is not pushed. Start it again from the then-current main.

## AR-A: what was done before the pause instruction (read-only)
Bob's 08:01Z «start AR-A» asked for a walk and a plan **before** any build. That is all that was done:
- the records were re-read;
- the dependent screens were walked on main's product, on a local stack with the synthetic bootstrap school;
- the plan below was sent to Bob (08:18Z), and Daisy got her §11 strings (08:18Z).

No product, test or SQL change was made.

### The records that bind AR-A (re-read 26 Nov)
- **Rulings:** 95, **96 (three facts)**, 99, 104 (Daisy's check-text refinement rides AR-A), 91 (no percentages) and 59 (no attempt number).
- **Daisy:** `ARA-KATA.md` (ux-1 `44b09b05`) holds the binding ID and EN words for every AR-A finding. §11 is pending: the walked strings, with 4 questions sent.
- **Sharon:**
  - AUDIT79-J7-1 `31a7bc94`: the public check never states the recalculated result; learner pages are counts-only.
  - CI-1-PREBUILD (b): one SQL helper; P4 reads `hasil_murid_id`; `verify_certificate`'s OUT signature is unchanged.
  - CI-1B-PREREVIEW, carried: the screen's unknown-review banner.

### The walk (main 2c96bdd2 product; raw results in `walk-catatan-1.json` and `walk-catatan-2.json`, the accessibility tree in `W2-aria.txt`)

**Confirmed:**

| Finding | What the walk saw |
|---|---|
| L-68 | The learner page says «…masih berlaku» while under review. |
| L-70 | «tidak pernah dihitung ulang» after a recalculation. |
| L-86 | No link to /verifikasi on the page. |
| L-103 | 2× h1, «Periksa keaslian» 4×, 2 QR images in the accessibility tree. |
| L-106 | «Lihat sertifikat» opens the replaced certificate, and «Buka sertifikat yang baru» goes to /verifikasi. |
| L-107 | The table is 862 px wide in a 710 px box at 1280. |
| L-108 | The heading reads «Cabut sertifikat · {nomor}». |
| L-109 | «✓ Sertifikat dikonfirmasi berlaku.» names neither the certificate nor the person. |

Also seen: the list's review read fails open to «Berlaku» (`belajar/sertifikat/page.tsx`).

**Not walked, and why:**
- **L-44 and L-16:** an official school issues the certificate when the page is opened, so this needs a non-official-school pass fixture.
- **L-66:** needs an open retake after a certificate was earned.
- **L-82:** Siapkan's certificate step shows only once a package is chosen.

The red-first fixtures will walk all three.

### Dependent screens: 14 found, 9 walked
- **Learner:** `/belajar/{t}/sertifikat` (with its print and PDF), `/belajar/sertifikat`, `/belajar/{t}/hasil`, `/belajar/{t}/lanjut`*, `/belajar/hasil`*, `/belajar`*.
- **Public:** `/verifikasi/{token}`, `/api/verifikasi/{token}`*.
- **Admin, `/konfigurasi/sertifikat`:** the table, the review section, and the panel (revoke and reissue).
- **Reissue redirect:** `/api/sertifikat/ganti`.
- **Teacher:** `/mengajar/{kelas}/siapkan`*.

(* = read in the code, still to be walked.)

### Open before the build (put to Bob, 08:18Z; no answer before the pause)
- (a) **Order:** the plan names «AR-C's helper» as part of AR-A's authority, but AR-C comes after AR-A. The proposal is to use the existing CI-1 SQL helper, with Sharon's pre-build review.
- (b) **L-106** likely touches an RPC (`my_certificate` is root-only), which needs Sharon's pre-build review.
- Daisy's 4 questions (§11):
  - the list pill when the review read fails;
  - the confirmed row note;
  - the replaced certificate's banner;
  - the review banner next to the fakta lines.

## Next steps on resumption (only on the owner's instruction)
1. Re-read the rulings and records again, plus any made over the break.
2. Get Bob's answers to (a) and (b), Daisy's §11, and Sharon's pre-build review where the build touches the DB or an RPC.
3. Branch `ar79/ar-a` from the then-current main, then go red first per finding, per the plan sent 08:18Z: fix at `keadaanSertifikat`, sweep the 14 screens at 1280/390/320 in ID and EN plus print and PDF, freeze, and verify (pintar-verification).
