# Journey captures (ruling 79, track 3c)

Each `jN.mjs` walks one of Daisy's journeys from the world `audit/dunia/muat.sh` loads to its last screen, and writes
under `AUDIT_OUT` (default `audit-out/perjalanan`): `jN/<pass>-<language>-<width>/`, holding one PNG per screen
(`NN-name.png`), with `.aria.yml` beside each screen in the screen-reader pass, and `langkah.json` (every step: reached,
or where the walk stopped; what was observed; the data read; the Tab presses it took). `jN/RINGKASAN.txt` has one
line per walk.

A step is SAMPAI (its screen reached) or BERHENTI (the walk could not go on: the capture is incomplete, the harness's
failure). An OBSERVED note records what a screen did where the script expected something else. It is not a verdict.

`lib.mjs` holds the shared parts:
- keyboard travel (`tabKe`, `tekan`, `ketik`: Tab until the control holds focus);
- the settled-screen wait (no «Memuat halaman…», a heading drawn);
- read-only data reads;
- the hooks for the passes Daisy and Second Eye run: `AUDIT_LALUAN=pembaca-layar | jaringan-lambat | gerak-dikurangi`.

| Journey | Script | World | Status |
|---|---|---|---|
| J1 · First day (SD) | `j1.mjs` | W1 | Daisy's corrected script (53c1af77; f19d202c for the wrong-PIN branch): L1 sign in by card · L2 /belajar · L3 the tour · L4 today's task; runs end to end at 1280, 390, 320 and in EN. Branches (`AUDIT_CABANG=1`, 1280): wrong card PINs until the wait (`card_signin_attempt`: 5 free tries in 15 minutes; the sixth waits 30 s, doubling to 5 minutes), the right PIN during the wait; a mistyped number (its words compared with a wrong PIN's on a real card, recorded); the tour closed at card 2 and reopened from «Bantuan»; signing out and back in on the same browser. The personal PIN and «Komputer siapa ini?» moved to J10 |
| J2 · One chapter, start to certificate | `j2.mjs` | J2's copy of W3 in the bootstrap tenant (13-j2-j3.sql) | on main 429b7dcc (D2-R): runs end to end at 1280, 390, 320, in EN, and in the screen-reader, reduced-motion and throttled passes; it loads the world afresh before each walk. Hana answers every question right by the chapter's key (read by the question's text; the order is shuffled per sitting), by keyboard. L1 Pemetaan Awal (saves on choosing) · L2 Peta Bacaan («Sudah kuat») · L3 a lesson from the map («Buka pelajarannya») · L4 the Uji Penguasaan's page · L5 the test (each answer by «Simpan jawaban ini»; «Kumpulkan sekarang?» confirmed; whether any hint was offered recorded) · L6 the result («Lulus.», the counts) · L7 the certificate · L8 the public check, signed out (opened by the certificate's token: the page shows the link as text). Labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)». Branches: next |
| J9 · A promotion, then a transfer across it | `j9.mjs` | W16 | runs end to end at 1280, 390, 320 and in EN; it loads the world afresh before each walk (it changes it). Two people on one browser in turn (keyboard; «Komputer siapa ini?» answered «pribadi»). L1 Flamboyan's admin promotes 7A to next year's 8A, Qori included · L2 Kenari's admin: «Terima perpindahan» on the old request, then «Laksanakan» · L3 a new request from Flamboyan (by Kenari's code KNR) · L4 Kenari: «Terima», «Laksanakan». Script f19d202c (L-35): the refusal at «Laksanakan». **Recorded:** «Terima» is accepted (REQUESTED → AUTHORIZED) and the refusal comes at «Laksanakan» (`transfer_execute`: «…sudah ditutup setelah permintaan pindah ini dibuat… tidak ada yang berubah»; nothing changes); the old request stays AUTHORIZED; Qori lands at Kenari in Kenari's current year (the first offered) WATCH (f19d202c), recorded in L2's data: `old_request_after` (still AUTHORIZED) and `laksanakan_offered_again` (1: yes) |
| J11 · Reading the school | `j11.mjs` | W18 | runs end to end at 1280, 390, 320 and in EN; read-only. The Kepala sekolah (DEAN at the root): L1 /pimpinan (and the calculator's domains, read as her) · L2 8P opened (the bands: Mantap 4, Berkembang 1) · L3 8R opened («belum cukup») and «Kesiapan bukti» · L4 the school summary: script f19d202c (L-37) step 4 is the scope line `laporan.cakupan.sekolah`, recorded as `scope_line`; its WATCH, the withheld domains named on the same page, recorded as `withheld_named_on_page`; every «semua»/«all» sentence too · L5 the print view (and a PDF at 1280). Labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)» |
| J12 · Operating PINTAR | `j12.mjs` | W19 (+ W3 running) | runs end to end at 1280, 390, 320 and in EN; it loads the world afresh before each walk. Admin PINTAR Hendra Kusuma, «Seluruh platform», keyboard; every step asserts its effect in the record. L1 plan a platform maintenance in 30 min · L2 extend it (reason, «Simpan perpanjangan»; the warning «24 asesmen dijadwalkan…» recorded) · L3 «Mulai sekarang», then «Akhiri sekarang» (ended early) · L4 an emergency stop («HENTIKAN SEKARANG») and its end (with its confirmation question) · L5 a test email to the sink · L6 Ratna's role renewed (2036 → 2037), Ratna's and the seed's «Admin Platform (sintetis)» released. Beside L1, L3 and L4, OBSERVER snapshots of what a learner (Rizky) and a teacher see. Script f19d202c (L-36): the last Admin PINTAR's row offers only «Perpanjang»; WATCH: whether the row says why (`peran.berakhir.terakhir`), recorded as `own_row_text` and `own_row_says_why` (on next-base: it does not); (b) THE HARNESS'S ADDRESS: at 127.0.0.1 the test email is refused as cross-origin (`BUKAN_ASAL_SAMA`; Next reports the server's origin as localhost), so the refusal is recorded and the send is walked again from localhost, where it is delivered |

**The clock:** the browser runs in the school's zone (WIB or WITA). The server's clock is the machine's, and every world
date is relative to the load time, so a capture's dates are the day it ran.

**J6 (AI drafts)** is walked with C3w-1's local stand-in provider, as 4.1 ships it. Its captures are labelled «penyedia
lokal (stand-in), bukan penyedia AI nyata». The real provider's draft quality is C3w-2's, and out of scope.

## Labels on captures

A walk on a state the reader must know about carries a label, in its `langkah.json` (`label`), in `LABEL.txt` beside
its screens, and on its line in `RINGKASAN.txt` (Bob, 24 Nov):

| Label | On |
|---|---|
| «keadaan warisan (dibuat melewati penjaga hari ini)» | every walk on W4 (a chapter given before a pass mark) |
| «keadaan fiksasi (dibuat melewati penjaga hari ini)» | every walk on W8 (a gate that cannot be read) |
| «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)» | every walk on W14 and W18 |
| «penyedia lokal (stand-in), bukan penyedia AI nyata» | every walk of J6 |
