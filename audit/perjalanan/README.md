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
| J1 · First day (SD) | `j1.mjs` | W1 | runs end to end. L4 (personal PIN) and L5 («Komputer siapa ini?») are recorded as the screen offers them: on next-base a class-card session is never asked about the computer (D-086(c)); a learner by email (W2) is asked at `/perangkat`, and the personal PIN is an email account's |
