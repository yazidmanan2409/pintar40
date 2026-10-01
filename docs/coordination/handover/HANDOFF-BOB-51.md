READY FOR GATE: CI #253 (run 36793949481) green on 4f11303eaf34f2be4e2d318361401bae20466bd1

# Bob → coordinator: BOB-51 («Kirim email uji»: the platform admin's delivery proof as a click)

- **SHA:** `4f11303`: two commits, `28cec45` (the page) and `4f11303` (a refused origin gets its own sentence), on top of BOB-50's hand-off (`9f7cc3a`).
- **Priority:** done before BOB-27, as you asked. It changes no BOB-26 or BOB-50 file.
- **Migration:** none.
- **Manifest:** v132 with 472 ids. That is 2 new: BOB51-A01 and BOB51-S01.
- **D-060:** stated below. Nothing here touches a metric or the engine.

## CHANGED
**The page: `/konfigurasi/email-uji`,** for the platform admin only.
- **Who sees it:**
  - Konfigurasi links it («Kirim email uji») only when `is_system_admin` is true.
  - The page asks `is_system_admin` itself and shows anyone else the one refusal page («Halaman ini hanya untuk admin platform.»).
  - The page decides nothing about the send. The route asks again.
- **What it holds:** one inbox field and one button, on the same shell and `pin-*` classes as Aktivasi.
- **What a press does:** one `POST /api/email/uji` `{ ke }`.
  - That is the existing route, **unchanged** (`git diff 9f7cc3a -- src/app/api/email/uji/route.ts` is empty).
  - It takes the same sending path as every PINTAR email: the same limits, and one send-log row.
  - The form sends nothing else, and it holds a second press while the first is working.
  - A missing `@` is caught before anything is sent.

**The answer, in plain Indonesian,** read by one pure reader, `bacaHasilUji` (`src/components/email-uji/hasil.ts`). Each of the route's answers has its own sentence:
- **Sent:** «Email uji terkirim ke *address*. Periksa kotak masuk alamat itu, termasuk folder spam. Rujukan: *id*».
- **Not sent,** with the reference:
  - the address limit;
  - the global limit;
  - the host refused;
  - could not connect.
- **The setting to fix, by name only:**
  - not filled in;
  - not a valid value;
  - not a secure connection;

  each followed by «Pengaturan yang perlu diperbaiki: `PINTAR_SMTP_HOST`» (or whichever name).
- **Refused:** the session ended; not the platform admin; the press did not come from a PINTAR page at that address (`BUKAN_ASAL_SAMA`, a sentence of its own so it is never read as «not the platform admin»); not a complete address; something went wrong in PINTAR; the request did not reach PINTAR.

**Names, never values:**
- A setting is shown only when its name is one of the five the sending module can carry. The list is `NAMA_PENGATURAN_EMAIL`, a new export of `src/app/api/_email/pengaturan.ts`, which stays the only file that names them (F01-S03). The page passes the list down to the form.
- Anything else in the name's place (a host, a password, a port) is not shown, and the sentence becomes «pengaturan email di server belum lengkap».
- A reference is shown only when it is a send-log id.

**Words:** the 24 new `emailuji.*` keys in `hle.ts`, in both languages, are placeholders for Daisy's polish pass.

## PROOF
- **BOB51-A01** (app; real Auth, PostgREST and the Mailpit sink):
  - Konfigurasi links the page for the platform admin and not for a school administrator.
  - The page shows the platform admin the form and no internal word. It shows a school administrator the refusal.
  - One press, exactly as the form makes it, sends the proof into the sink. The page's own reader reads it as «terkirim» with its reference, and the send log says SENT.
  - A second press within the minute reads as the address limit, with its reference.
  - A school administrator's press is refused (403, «Hanya admin platform…»), and nothing more is sent: 1 message in the sink, 2 send-log rows (the proof and the limit's refusal).
- **BOB51-S01** (static):
  - Every answer the route can give is read out of the route and the sending module: 5 codes, 4 reasons, 3 setting codes, a sent proof, and no answer. Each maps to its own sentence, in both languages (15 sentences), no two of the route's codes sharing one.
  - Each of the five names is shown under each setting code, and four planted values in its place are not.
  - The names the page may show are exactly the names the sending module reads.
  - The form makes one request, to `/api/email/uji`, with the inbox alone, and reads the answer only through `bacaHasilUji`.
  - The page asks `is_system_admin` and refuses everyone else. Konfigurasi links it for the platform admin alone.
- **The page joins** `ROUTE_INVENTORY` (the F06-R01 and F06-S02 internal-word sweep) and the re-set surfaces (a named addition to their lists, not a restated test).

**Red on `9f7cc3a`** (the lane before this commit), the same test file:
- BOB51-S01: `there is no «Kirim email uji»: src/components/email-uji/hasil.ts, …FormEmailUji.tsx, src/app/konfigurasi/email-uji/page.tsx missing`.
- BOB51-A01, on a rig running the app built from that tree: `Konfigurasi offers the platform admin no link to «Kirim email uji»; the platform admin's page answered 404 without the form; a school administrator was shown the form rather than the refusal`.
- The press itself already worked there, since the route is unchanged.

**Local, on `4f11303`:**
- **Full suite** on a fresh CI-shaped database: 433 passed, 0 failed. The one unjustified skip, UX1-PIMPINAN-AKSES-01, needs the network facility, as before; 38 local-only justified skips (BOB51-A01 among them, which needs Auth and the sink).
- **Plants:** 144/144 proved their gate.
- **Rig** (real Auth): 467 passed, 0 skipped, BOB51-A01, BOB51-S01, F06-R01 and F06-S02 among them. The 4 failures are the four tests that need Storage, which the rig does not run (F01-R03, BOB11-A01, BOB11-A02, BOB20-A01), as on `main`.
- **The 24 db red-case gates** were not re-run locally, because this commit changes no SQL, no plant and no suite file. CI runs them.

## CI
**CI #253 (run 36793949481, https://github.com/yazidmanan2409/pintar40/actions/runs/36793949481) on `4f11303eaf34f2be4e2d318361401bae20466bd1`: success, 35/35 jobs green.** This is BOB-51's own run: I dispatched it once on the lane head and watched it to the end.
- **Strict suite (local stack):** 472 passed, 0 failed, 0 skipped, 0 contract problems → GREEN. That includes BOB51-A01, the real send into the CI sink through the route, and BOB51-S01.
- **Every red-case gate** passed, `db-bob50-gates` and `db-bob26-gates` among them.

## CONTRACT
- The page `/konfigurasi/email-uji` is new, with a new client component, `FormEmailUji({ locale, namaPengaturan })`.
- The pure reader `bacaHasilUji(status, jawaban, namaSah)` is new, as are `alamatLengkap` and the types `HasilUji` and `NadaUji` (`src/components/email-uji/hasil.ts`).
- `NAMA_PENGATURAN_EMAIL` is a new export of `src/app/api/_email/pengaturan.ts`. It holds names only, and nothing else in that module changed.
- `POST /api/email/uji`: unchanged. No RPC and no grant changed.

## MIGRATIONS
None.

## COPY (FOR DAISY)
- The 25 `emailuji.*` keys are mine, written in the existing staff pattern, and are Daisy's to replace at the polish pass: the title, intro, field, button, the four «Belum terkirim» reasons, the four setting sentences, and the refusals.
- The result line uses `BarisHasil` (DAISY-18), so it is announced and scrolled into view like every other result.

## D-060
- **Metric catalogue: unchanged.** Nothing reads evidence or computes a figure.
- **Engine: unchanged.** Nothing grades, assembles or finalizes.

## FOR THE COORDINATOR
1. **M6 and C-11 are now a click:** sign in as the platform admin → Konfigurasi → «Kirim email uji» → the inbox → «Kirim email uji». The answer says what happened, and a failed send names its reason or the setting to fix.
2. **About the empty staging send log** (the board's M6 note): the route writes a row only after four checks pass: same origin, signed in, platform admin, and the settings read. So an empty log means one of those four refused, not necessarily the settings. The page now says which.
3. **Measured while testing the route over HTTP for the first time.** BOB-25's tests drove the sending module directly, never the route.
   - The route's same-origin check compares Origin with `request.nextUrl.origin`.
   - Under a local `next start`, Next builds that from its own hostname, `http://localhost:<port>`, whatever the Host header says. So locally the press works when the page is opened at `http://localhost:3999`, and is refused (`BUKAN_ASAL_SAMA`) at `http://127.0.0.1:3999`.
   - On Vercel, Next trusts the Host header (`trustHostHeader`, set whenever `hasNextSupport`, `next/dist/server/config.js:355`), so staging and production compare the real domain and the press is accepted.
   - The route is therefore unchanged, and BOB51-A01 opens the page at the origin the route is addressed by, as a browser would.
   - If staging's click ever answers «…tidak datang dari halaman PINTAR di alamat ini…», this is the cause. The fix would be the shared `asalSendiri` rule that BOB-26's doors use, a one-line change to the route. That is yours to rule; I have not made it.

## QUESTIONS
None.

## READY
Yes.
