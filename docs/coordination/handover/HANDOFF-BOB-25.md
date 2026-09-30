READY FOR GATE: CI #241 (run 36697114746) green on 1f00fa07ecea87e1398c5d7d391db182dcfb5817

# Bob → coordinator: BOB-25 (Gate 2E: PINTAR sends its own email)

**SHA:**
- `2bcbed8`: the template interface and contract, published first for DAISY-19;
- `48f791a`: the build;
- `f3801bd`: a test's failure text never prints the test password;
- `1f00fa0`: the proof route answers codes, never an error's message (BOB07-K01), and the manifest names what two tests execute (F06-S04);
- `e2bcfa1`: the contract confirms the build.

`main` `daa5721` is merged in.
- **Manifest:** F17-L01, F17-L02, F17-N01, F17-C01, BOB25-K01, BOB25-S01 and BOB25-A01. The lane's manifest is v127 with 445 ids. The new facility `mailsink` is the Mailpit sink.
- **CI:** CI #241 (run `36697114746`, https://github.com/yazidmanan2409/pintar40/actions/runs/36697114746) on `1f00fa07ecea87e1398c5d7d391db182dcfb5817`, green, 33 of 33 jobs.
- D-057(a)(c), C-09, GATE-0-FACTS §2.

## CHANGED
**Daisy's contract, published first** (`2bcbed8`, `docs/coordination/handover/BOB-25-CONTRACT.md`):
- `src/lib/email/templat.ts` holds types only.
- A template is `Templat<D> = (data, konteks) => { subjek, html, teks }`, which is exactly what the frame's `bingkaiEmail()` returns.
- `KonteksEmail = { asal, staging }` is supplied by the module. Each environment's logo is built from `asal` (DAISY-19 ruling 2), and the test line shows when `staging` is true (ruling 3).
- The seven kinds are D-057(a)'s six plus Gate 2E's `UJI_PENGIRIMAN`.
- A template never chooses FROM, Reply-To or the recipient, never reads configuration and never sends. Per-email data shapes belong to each email's gate.

**The sending module, `src/app/api/_email/`.** It is a private folder, not a route, and every file is `server-only`. It lives under `src/app/api/` because it writes the send log with the service-role client, which F01-S03 allows only there.

(1) + (4) **`pengaturan.ts`** is the one reader of the settings (F01-S03 pins it).
- It reads exactly `PINTAR_SMTP_HOST`, `PINTAR_SMTP_PORT`, `PINTAR_SMTP_USER` and `PINTAR_SMTP_PASSWORD`, plus the existing `NEXT_PUBLIC_APP_URL` for the origin.
- There is no fallback. A missing or empty variable throws `VARIABEL_HILANG`, naming the variable and never a value.
- Port 465 is TLS from the first byte, with the certificate checked against the host (`rejectUnauthorized`, `servername`, TLS 1.2 or higher).
- A plain connection is allowed only to `127.0.0.1`, `localhost` or `::1` (the sink). Anything else is refused as `KONEKSI_TIDAK_AMAN` before connecting.
- FROM is the SMTP user, as «Tim PINTAR» on `https://app.pintarselalu.com` and «Tim PINTAR (Staging)» on every other origin. Reply-To is `info@pintarselalu.com`.

(1) **`kirim.ts`: `kirimEmail({ ke, jenis, susun }) → HasilKirim`.** Nodemailer 10.0.13; the 7.x line has open advisories.
1. It reads the settings. A configuration error throws before anything is counted or sent.
2. It normalises the address (trimmed, lower-cased, one address).
3. It checks the finished email. An empty subject or body, or a subject with a line break (header injection), throws before anything is counted.
4. It reserves under the limits. A refusal is logged and sends nothing: `BATAS_ALAMAT` or `BATAS_UMUM`.
5. It sends `multipart/alternative`, with file and URL access disabled.
6. It settles the log.
7. **A send the host refuses (any SMTP reply code, its hourly limit included), or one that never connects, is reported as not sent** (`DITOLAK_SERVER` or `GAGAL_KIRIM`), never as sent, and is logged with its code. Only the reference, the kind, the reason and the code reach the console, never the address, the host's reply text or the message.

(2) + (3) **Migration `20261026100000_pintar_sends_its_own_email.sql`** (the 132nd):
- **`email_send_log` has eight columns:** id, kind, the recipient's SHA-256, outcome, limit scope, SMTP code, requested and settled times.
  - It has no column that could hold an address, a code, a PIN, a password or the message.
  - The address is hashed on the server, so the database never sees it.
- **`email_send_limits` holds three rows, proposed for your confirmation:**
  - per address and kind, 1 per 60 s (the resend countdown);
  - per address, 6 per hour;
  - globally, 200 per hour (not designed around the host's limit, D-053(b)).
- An attempt counts unless the limits themselves refused it: a send the host refused still used the host. Once a window has passed, the same address goes again.
- **`email_send_reserve`** runs under one transaction-scoped advisory lock, so two requests at the same moment cannot both pass a limit. **`email_send_settle`** settles a pending row once, as SENT, REFUSED_BY_HOST or FAILED.
- Both tables have RLS and no policy. Both functions can be run by service_role only.

(5) **`kode.ts`: `terbitkanKodeEmail(authUserId)`** looks up an **existing** Auth user by id and asks admin `generate_link` (`magiclink`) for that user's `email_otp`.
- It can never create a user: an address has no path to `generate_link` through here.
- Nothing logs or stores the code.
- Who may receive a code (D-054(a)) is Gate 3's rule.

(6) The template interface, above.

(7) **The sink.**
- CI's strict job starts Mailpit `v1.31.3` on loopback (SMTP 54325, API 54324, chaos enabled).
- Local runs use the same ports, with Mailpit built from the Go module proxy (GitHub release downloads are blocked here).
- No CI or local send goes anywhere else.

**The staging proof, `POST /api/email/uji`:**
- It needs a same-origin request from a signed-in person the database says is a platform admin (`is_system_admin`, under their own token).
- It sends one `UJI_PENGIRIMAN` through the same path, limits and log included.
- It has a plain placeholder template until DAISY-19 wires the frame.

## PROOF
**Red on today's code** (`daa5721`):
- fable17 cannot even load: `function public.email_send_reserve(text, text) does not exist`.
- BOB25-K01, S01 and A01 find no module.

**Red for each rule the acceptance names:** each planted on the built code, each red, then green again.
- **The limits** (`db-bob25-gates`, five plants): each turns its own F17 test red.
  - bob25-1: a refusal fills the window → F17-L01.
  - bob25-2: a host refusal is free → F17-L01.
  - bob25-3: a send settles twice → F17-L02.
  - bob25-4: `authenticated` may reserve → F17-N01.
  - bob25-5: the per-kind minute is forgotten → F17-L01.
- **Concurrency:** with the advisory lock removed, F17-C01 is red: `2 of 11 simultaneous reservations for one kind and address were allowed, expected 1`. With the lock it is green.
- **The module, mutated one rule at a time in a worktree and run against the real sink:**

| Mutation | Red |
|---|---|
| a missing `PINTAR_SMTP_HOST` falls back to `localhost` | K01 `PINTAR_SMTP_HOST missing was answered {…}, not refused by name`; S01 `… was answered SENT; a refused configuration or email was counted in the send log; … reached the sink` |
| an unencrypted connection allowed to a non-local host (587) | K01 `pintarselalu.com:587 was answered "SINK", not refused as unencrypted`; S01 `an unencrypted connection to smtp.example.com:587 was answered SENT` |
| the certificate not checked | K01 `the transport does not use TLS from the first byte with the certificate checked against the host` |
| a host refusal reported as sent | S01 `a send the host refused with 451 was answered {"terkirim":true,…}; a send with nothing listening was answered {"terkirim":true,…}` |
| the address logged on a refusal | K01 `the module logs more than its reference and outcome`; S01 `the module's console output holds an address` |
| a subject carrying a header | S01 `a subject carrying a header was sent; … reached the sink` |
| Reply-To dropped | S01 `Reply-To is []` |
| an SMTP variable read outside the module | F01-S03 `src/lib/bocor-smtp.ts names a PINTAR_SMTP_ variable; only src/app/api/_email/pengaturan.ts may` |

**Green now:**
- **F17-L01, L02, N01** (db): the limits by each scope, what counts, windows passing, the log's rules, and access, including a signed-in platform admin and a stranger refused by the privileges themselves.
- **F17-C01** (db, `run.ts`): eleven reservations at the same moment, the first held open 1.5 s. Exactly one is allowed, and the log holds one PENDING and ten ADDRESS_KIND refusals.
- **BOB25-K01** (static): the configuration rules, executed across every variable, empty and missing, and every connection case, and the module's shape read from source.
- **BOB25-S01** (db + sink): real sends into Mailpit, logged by the database's own functions.
  - **Sent:** FROM «Tim PINTAR (Staging)» / «Tim PINTAR» as `noreply@pintarselalu.com`, Reply-To `info@pintarselalu.com`, the address normalised, both parts whole, logged SENT 250.
  - **Refused by the limits:** the minute's limit refuses before the host.
  - **Refused by the host:** Mailpit's chaos, a 451 to the recipient, gives `DITOLAK_SERVER`. Nothing is delivered, the row is REFUSED_BY_HOST 451, and **after the minute the same address is sent**.
  - **No listener:** `GAGAL_KIRIM`, logged FAILED.
  - **Refused before anything is counted:** a missing variable, an unencrypted non-local host and a header in the subject. The log's row count is unchanged and the sink is empty.
  - **The log and the console hold no address, code or password.**
- **BOB25-A01** (CI's local stack: Auth, PostgREST, the sink):
  - `generate_link` issues a code for an existing user, and it verifies.
  - An unknown id and an address issue nothing, and no Auth user is created.
  - The production path (the service-role RPCs) sends into the sink and logs SENT without the code.
  - It is skipped locally with its justification (no Docker here); CI runs it strictly.
- **The bundle scan (F01-S03), extended:**
  - `PINTAR_SMTP_HOST`, `_PORT`, `_USER`, `_PASSWORD` and `nodemailer` never reach `.next/static`.
  - The four names have one reader, `server-only`, and nodemailer one importer.
  - Green on the production build.

**Local, on fresh CI-shaped databases** (the migrations through the Supabase CLI and the seeds, no selftest file until a job loads what CI loads; `en-US` ICU collation; Supabase's default privileges emulated; Mailpit v1.31.3 on 54325/54324):
- **Full suite on `1f00fa0`:** 412 passed and 0 failed, with 32 justified skips. BOB25-A01 is among them (no Docker here). The one unjustified skip, UX1-PIMPINAN-AKSES-01, needs network, as before.
- **The first run, on `f3801bd`, found two faults in my own code:**
  - BOB07-K01: the proof route returned `e.message` two ways;
  - F06-S04: two `proves` did not name their artefact.
  - Both are fixed in `1f00fa0`, and neither was a test changed to pass.
- **Plants:** 132 of 132 proved their gates, `db-bob25-gates` among them. They ran on `f3801bd`, and no SQL changed after it.
- **Every db red-case gate in the `ci.yml` matrix** (22; db-table-without-rls left to CI) ran on its own new stack, from scripts freshly extracted from the current `ci.yml`.
  - All exited 0, with no heredoc warnings.
  - The inline gates turned their rows red: fable04 12, fable05 15, fable06 39, task1 9, task2 9, tour 24, wp1 39.
  - The plant gates proved every plant.
  - `db-bob25-gates`: 5 of 5.

**Restated for the changed requirement:**
- The migration tripwires move 131 → 132, with the reason beside them.
- F01-S03 gains five forbidden names and two reader rules. Nothing is removed.
- `scripts/dev/plants.mjs` loads `fable17.sql`.

## CI
## CI
- **CI #241 (run `36697114746`, https://github.com/yazidmanan2409/pintar40/actions/runs/36697114746), green, 33 of 33 jobs.** It was a `workflow_dispatch` on `claude/quirky-meitner-a04smj` at `1f00fa07ecea87e1398c5d7d391db182dcfb5817`, with `main` `daa5721` merged in, and I watched it to the end.
- **The strict selftest contract:** 445 passed, 0 failed, **0 skipped**.
  - F17-L01, L02, N01 and C01, BOB25-K01 and BOB25-S01 ran against the Mailpit sink the job starts.
  - **BOB25-A01 passed against real Auth:** `generate_link issued a code for an existing user and it verified; an unknown id and an address issued nothing and no Auth user was created; the service-role path reserved, sent into the sink and logged SENT without the code`.
- The red-case matrix gains `db-bob25-gates`, and it is green.


## CONTRACT
- The template interface and `kirimEmail` are as `BOB-25-CONTRACT.md` says. The one addition is `kirimEmail`'s optional second argument, the send log, which production omits.
- `terbitkanKodeEmail(authUserId) → { email, kode } | null`.
- `POST /api/email/uji` `{ ke }` → `{ terkirim, rujukan }`, or `{ terkirim: false, alasan, rujukan }` when not sent, or `{ terkirim: false, galat[, variabel] }` when refused before sending.
- There is no new client RPC.

## MIGRATIONS
`20261026100000`: two tables, two service-role functions and three limit rows. It is additive, lane-only and unmerged, with no backfill.

## COPY
- **The proof email only** (`src/app/api/_email/uji.ts`). Its words are a plain placeholder («Uji pengiriman email PINTAR», three sentences, the PIN/password line, a test line on staging), sent only to a platform admin's own inbox.
- Daisy may give it the frame once DAISY-19 is wired, and that email is then the M6 render.
- No `hle.ts` key and no product screen is added.

## D-060
- **Metric catalogue: unchanged**, because nothing reads evidence or computes a metric.
- **Engine: unchanged**, because nothing grades, assembles or finalizes.

## AFTER THE MERGE: the staging proof and the M6 inboxes
Staging builds `main` only (D-062(a)), so the staging send happens after the merge and staging's redeploy.
1. **Vercel (Yazid):**
   - `pintar40-staging`, Production environment, needs all four variables with the GATE-0-FACTS §2 values: `PINTAR_SMTP_HOST=pintarselalu.com`, `PINTAR_SMTP_PORT=465`, `PINTAR_SMTP_USER=noreply@pintarselalu.com`, and `PINTAR_SMTP_PASSWORD` (Sensitive; already set).
   - **I cannot read Vercel's settings from here, so I do not know whether HOST, PORT and USER are set.** The proof tells you: a missing one is answered `{"terkirim":false,"galat":"VARIABEL_HILANG","variabel":"PINTAR_SMTP_HOST"}`, naming it and never showing a value.
2. **The one send (Yazid, signed in on `https://staging.pintarselalu.com` as the platform admin).**
   - In the browser's console, run:
     ```js
     fetch("/api/email/uji", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ke: "<the named inbox>" }) }).then((r) => r.json()).then(console.log)
     ```
   - `{ terkirim: true, rujukan }` means the deployed function reached `pintarselalu.com:465` and the host accepted the email.
   - `DITOLAK_SERVER` or `GAGAL_KIRIM` means it did not, and nothing is claimed as sent.
   - The per-kind limit allows one proof a minute per inbox.
3. **M6:** Yazid supplies the Gmail and Outlook/Hotmail inboxes after that first send. The same call to each, then «Show original» for SPF, DKIM and DMARC PASS.

## QUESTIONS
1. **The limit values** (1/min per address and kind, 6/hour per address, 200/hour globally) are my proposal. The gate should confirm them or give others. A change is one migration row.
2. **Security notices to `admin_gt@`** count against the per-address limit like any other email. BOB-28 sends them only at thresholds, so 6 an hour should not bind. If you want them exempt, it is one scope row.

## READY
Yes.

---
### Summary (ready to paste)
```
BOB-25 (interface 2bcbed8, build 48f791a, fixes f3801bd 1f00fa0), ready for the gate in CI #241 (run 36697114746) on 1f00fa0.
PINTAR sends its own email through src/app/api/_email/ (server-only): exactly the four PINTAR_SMTP_ variables, no fallback;
TLS on 465 with the certificate checked, plain only to this machine (Mailpit), anything else refused before connecting;
FROM the SMTP user as «Tim PINTAR» / «Tim PINTAR (Staging)», Reply-To info@pintarselalu.com. A host refusal or no connection
is reported NOT SENT and logged. Send log (SHA-256 recipient; no address, code, PIN, password or message) and limits
(1/min/address/kind, 6/h/address, 200/h global; one lock) in migration 20261026100000. generate_link email_otp for an
existing user only. Template interface src/lib/email/templat.ts for DAISY-19. Staging proof POST /api/email/uji (platform
admin) after the merge; M6 inboxes then. Gate db-bob25-gates (5 plants), F17-C01, BOB25-K01/S01/A01, F01-S03 extended.
D-060: catalogue and engine unchanged.
```
