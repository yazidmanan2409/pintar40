# After merge 2 (stream B, 23 Nov 2026): Z6's sweep run 2, «Menga jar», «target 60 %», and Z8's two re-looks

> **What holds now:** on the merged tree (`claude/z` `6bc4123a`, merged into `claude/z-ux` by fast-forward; local
> database reset to its migrations):
> - **Sweep run 2: GREEN, 130 checks on 13 pages,** six of them stream A's K-01 verdict screens (`z6-sapu-2.txt`).
> - **«Menga jar» does not reproduce.** No code change.
> - **«target 60 %»: captured for Daisy, not changed.** It is on stream A's K-01 page.
> - **The re-looks, captured for Daisy:** A1-R4's queue rows and C1-R4's printed predicate.

## 1 · Sweep run 2 (`layar/sapu-z6.ts`, one command)

**What it checks**, at 1280, 390 and 320:
- `BINGKAI`;
- every option of a segmented control inside it, with its focus ring uncut;
- no link mark drawn as a box;
- «Berikutnya» landing below the bar;
- new in run 2: **every word in the bar is whole.** One line box per word, except a name cut with an ellipsis by design.

| Covered | Drawn by |
|---|---|
| `/mengajar/[kelas]`, `/mengajar/[kelas]/siapa` (both instruments), `/mengajar/[kelas]/uji-cepat` | Koleksi, `pin-seg` |
| `/aktivasi/orang`, `/konfigurasi/catatan-masuk`, `/konfigurasi/audit` | region tables |
| **K-01:** the bootstrap class page, the teacher's page for one learner below target, «Minta membaca lagi» (`/ulang`), the learner's result (`/belajar/[tugas]/hasil`), the head of department's home, the approver's queue | measured whether or not they draw a frame |

| Not covered | Why |
|---|---|
| `/mengajar/[kelas]/uji-cepat/hasil`, `/konfigurasi/sertifikat` | they draw no table when they have no rows |
| `/studio/tinjau/kunci/[koreksi]` | it needs a pending key correction, which this database has none of |
| Studio's package page | it draws no frame; it is measured for N-8 only |

The merge added no new file drawing `pin-tabel-bingkai` or `pin-seg` (the sweep reads them from the source).

## 2 · «Menga jar» (Second Eye, in passing)

- **Not reproduced on the merged tree.** «Mengajar» in the teacher's bar is one line box at **every width from 300 to
  430 px in 5 px steps**, and run 2's word check passes on every page at 1280, 390 and 320.
- **The likely cause is fixed already.** Before Z6's bar fix (`3472d3a4`, Daisy's finding b, now merged), every place
  word broke at 320: «Konfigurasi», «Pendataan», «Aktivasi», «Laporkan masalah» (`z-ux-merah-z5r.txt`). «Mengajar» is in
  the same bar.
- **If Second Eye saw it on the merged build,** the page and width are wanted.

## 3 · «target 60 %» on «Minta membaca lagi» (for Daisy: a defect?)

- **What shows:** «target 60%» is a lone `p.pin-meta` line above the «Murid» group, outdented from it (x 32 against
  «Murid» at x 56 at 390 and 320), at **every** width, not only 320.
- **Captures:** `layar/ulang-target-1280.png`, `-390.png` and `-320.png`, reached by keyboard from the teacher's page
  (Enter on «Minta membaca lagi»). Notes are in `layar/CATATAN-ULANG.txt`.
- **The page is stream A's** (K-01, `src/app/mengajar/[kelas]/ulang/page.tsx`), so it is not changed here.
- **Also seen there:** at 390 and 320 the breadcrumb's second line begins with a bare «/» («/ 5B / 2026/27»).

## 4 · Z8's two re-looks after merge 2 (`layar/tangkap-z8.ts`, same session)

**A1-R4: the queue rows' words.** The head of department's queue (`z8-03b-kadep-antrean-*`) reads «hasil terakhir
100%». That is `hasil_saja`: the request is for a Pemetaan Awal, which has no target. The school admin's rows carry no
result, by design (`z8-02`).
- **Not reachable here:** the gate-failed form, `hasil_gerbang` («… target {target} belum tercapai: soal penting belum
  tepat»). It needs a result with a target whose gate failed, which stream A's K-01 fixtures build.

**C1-R4: the printed predicate.** The certificate under review prints «Sangat Baik», with its QR. The review banner is
not printed, and no status word is (`z8-06-*`, and `z8-06-sertifikat-cetak.pdf`). The public check reads «Sedang
ditinjau» (`z8-07-*`).

## Environment notes

- On a freshly reset database, `fable06` asks for `fable04` first. The Z6 and Z8 scripts now load `fable01/03/04`
  before A1's fixtures.
- The bootstrap learner has one attempt, so the `ulang` world (below target) and the certificate world (passing) were
  taken on two resets.
