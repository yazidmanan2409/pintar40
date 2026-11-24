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
| J1 · First day (SD) | `j1.mjs` | W1 | Daisy's corrected script (53c1af77): L1 sign in by card · L2 /belajar · L3 the tour · L4 today's task; runs end to end at 1280, 390, 320 and in EN. Branches (`AUDIT_CABANG=1`, 1280): a wrong card PIN three times as scripted, then on to the sixth, where the product's first wait comes (`card_signin_attempt`: 5 free tries in 15 minutes, then 30 s doubling to 300 s; tries 4–6 are labelled beyond the script), the right PIN during the wait; a mistyped number (its words compared with a wrong PIN's on a real card, recorded); the tour closed at card 2 and reopened from «Bantuan»; signing out and back in on the same browser. The personal PIN and «Komputer siapa ini?» moved to J10 |

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
