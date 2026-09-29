# Identity Gate 0: external facts (C-09)

**Status: Gate 0 DONE (29 Sep).** Automated reads done; M1–M5 satisfied. Two items are carried forward, not open: M6 goes into BOB-25's acceptance (after its first staging send), and the Stellar Business upgrade is readiness-triggered: before broader real-user rollout, after the testing stage (D-053 as amended 29 Sep). M7 is optional (§3).

**Sources, all read-only:**
- `identity-facts.yml` runs 36500989135 and 36501186293: Supabase Auth settings, allow-listed and non-secret; template bodies hashed, never printed; DNS via `dig` on a GitHub runner.
- One batched SQL read per project.
- The Supabase MCP organisation read.

Nothing was written anywhere.

## 1. Established facts

**Platform**

| Fact | Staging | Production | Consequence |
|---|---|---|---|
| Supabase plan | **Pro** (organisation ZAYD, both projects) | same | Leaked-password check, session time-box and inactivity limit are all available (C18) |
| Postgres | 17.6 | 17.6 | — |
| `pgcrypto` | installed | installed | bcrypt for the PIN (BOB-24) |
| `pg_cron` / `pg_net` | available, not installed | same | Server-side ending of abandoned sessions possible (BOB-29) |
| `postgres` may DELETE `auth.sessions` | yes | yes | A session can be ended on the server even if its browser never returns (BOB-29) |
| PostgREST pre-request hook | none configured (`authenticator`: statement and lock timeouts only) | same | To be proven in the BOB-29 prototype before relying on it |

**Accounts** (28 Sep)

| Fact | Staging | Production | Consequence |
|---|---|---|---|
| Accounts | 3 EMAIL (all with roles), 50 synthetic CLASSROOM_CARD, 0 personas | 1 person, 1 EMAIL (sole SYSTEM_ADMIN), 0 cards, 0 personas, 0 sessions | Transition: C10, break-glass for the sole admin |

**Supabase Auth settings**

| Fact | Staging | Production | Consequence |
|---|---|---|---|
| Sign-up | `disable_signup` true | true | Kept (C1) |
| Code length / life | `mailer_otp_length` **8**, `mailer_otp_exp` **3600** | same | Set to **6** and **600 s** (Gate 3 settings) |
| Password policy | min length **6**, no required characters, `password_hibp_enabled` **false** | same | Set the Gate 3 policy; turn the leaked-password check on (Pro) |
| **Password change** | `security_update_password_require_current_password` **false**, `…require_reauthentication` **false** (production read; staging identical on every visible key) | same | **Gap:** once passwords exist, an unattended session could change the password. Gate 3 must close it (passwords set only by PINTAR's server routes after code or PIN; the direct change requires the current password) |
| MFA | TOTP enrol and verify **on**; phone and WebAuthn off | same | Unused by PINTAR; turn enrolment off at Gate 3 (no unused credential surface) |
| CAPTCHA | off | off | Not required by the rulings |
| Client-address forwarding | `security_sb_forwarded_for_enabled` **false** | false | BOB-12 (Gate 1) |
| Sessions | `sessions_timebox` 0, `sessions_inactivity_timeout` 0, `single_per_user` false, refresh rotation on (reuse 10 s), `jwt_exp` 3600 | same | Personal ~7 days kept by cookie (D-055); a server backstop is available |
| Email limits | `rate_limit_email_sent` 2/h, `smtp_max_frequency` 60 s, `rate_limit_otp` 30, `rate_limit_verify` 30 | same | With the C8 path, PINTAR's own limits govern user emails (BOB-25) |
| **Email templates** | **All Supabase defaults, English.** No custom subject or body (e.g. "Your sign-in link", "Reset your password"); password-changed notification off | same | Today's sign-in email is Supabase's default. Under C8 PINTAR sends its own; Supabase's templates are branded only as a fallback (dashboard break-glass) |
| SMTP | `pintarselalu.com:465`, user and admin email `noreply@pintarselalu.com`, sender "PINTAR Staging" | same, sender "PINTAR"; `site_url` `https://app.pintarselalu.com` | The SMTP authentication mailbox already exists and works for Supabase |

**Mail domain (`pintarselalu.com`)**

| Record | Value | Consequence |
|---|---|---|
| SPF | `v=spf1 +mx +a +ip4:209.74.67.49 +include:spf.web-hosting.com ~all` | Namecheap's servers are authorised |
| DKIM | `default._domainkey` published (RSA 2048) | Namecheap/cPanel signing is set up |
| DMARC | `v=DMARC1; p=none;` (no reporting address) | Monitor-only. **Recommended:** add `rua=mailto:admin_gt@pintarselalu.com` for reports (Yazid's DNS; optional) |
| MX | `mail.pintarselalu.com` | Mail is hosted at Namecheap |

## 2. Sending architecture (C8, fixed at Gate 0)

- **Path.** PINTAR's server sends through Namecheap SMTP (`pintarselalu.com:465`, SSL), authenticated as the existing mailbox `noreply@pintarselalu.com`. This is the same mailbox and host Supabase already uses, so SPF (the `include:spf.web-hosting.com`) and DKIM (the `default` selector) apply.
- **Codes.** Supabase issues activation and recovery codes through admin `generate_link` (`email_otp`) inside `src/app/api/` only, and PINTAR's email carries them. `verifyOtp` checks them.
- **Limits.** PINTAR's own per-address and global limits apply to every send (BOB-25).
- **Until the Stellar Business upgrade, the domain's 50 per hour is one shared budget:** staging, production, Supabase's own emails and any mail sent from cPanel all count against it. BOB-25's staging proof is a handful of single messages, well within it. PINTAR's limits are not designed around 50 (D-053(b)). The pilot runs within it by scheduling (about 20 activations per hour), and staging's real sends are kept to proofs while the pilot runs. When the host refuses a send over its limit, PINTAR says the email was not sent, never that it was (BOB-25).
- **Supabase's own emails** are not used by PINTAR's flows. Their templates get a minimal Bahasa Indonesia fallback only for dashboard-initiated emails (break-glass).
- **Still to prove in BOB-25:** that Vercel functions can reach port 465, and PASS results in a real inbox.

**Vercel variables (BOB-25's contract, fixed 29 Sep)**

The SMTP settings Yazid read from cPanel on 29 Sep are the ones Supabase already uses: host `pintarselalu.com`, port 465, SSL/TLS, authentication required, user `noreply@pintarselalu.com`. BOB-25's sending module reads exactly these four variables. Nothing else configures SMTP.

| Variable | Value | Vercel type |
|---|---|---|
| `PINTAR_SMTP_HOST` | `pintarselalu.com` | plain |
| `PINTAR_SMTP_PORT` | `465` | plain |
| `PINTAR_SMTP_USER` | `noreply@pintarselalu.com` | plain |
| `PINTAR_SMTP_PASSWORD` | the `noreply@` mailbox password. Yazid enters it; it never appears in chat, the repository or a screenshot | **Sensitive** |

- **Where the variables go.**
  - First in `pintar40-staging`, **Production** environment only. That environment serves `staging.pintarselalu.com`, and the project builds nothing else. The variables are not set in Preview or Development.
  - In `pintar40` (production) only at the Gate 8 release, also Production only. The four names then join the deploy workflow's required-variable check.
- **Why the names have no prefix.** They follow every other runtime variable inside an environment's own Vercel project (`CARD_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY`; D-044(a)). The code reads one name everywhere, and each Vercel project is its environment's store. `PINTAR_SMTP_PASSWORD` is also the name of the existing GitHub secret for this mailbox.
- **No other SMTP settings.**
  - There is no TLS switch. Port 465 means TLS from the first byte, with the certificate checked.
  - An unencrypted connection is allowed only to a local sink (`127.0.0.1` / `localhost`: Mailpit in CI and local runs). Any other combination is refused before connecting.
  - There are no fallback values. A missing variable stops the send with an error (FABLE-01).
- **FROM and Reply-To are fixed in code, not variables.**
  - The FROM address is `PINTAR_SMTP_USER`, so the two cannot diverge.
  - The display name is "Tim PINTAR". Every origin other than `https://app.pintarselalu.com` (read from `NEXT_PUBLIC_APP_URL`) gets "Tim PINTAR (Staging)" and the test line in the body (DAISY-19 ruling 3), so no environment except production can look like production.
  - Reply-To is `info@pintarselalu.com`.
- **Server only.**
  - The variables never take a `NEXT_PUBLIC_` name.
  - The server sending module is the only reader.
  - BOB-25's bundle scan proves they are absent from the browser bundle.
- **One credential is shared.** Staging sends from the same mailbox as production (M3), as staging's Supabase SMTP already does (`staging.yml`). So the staging project holds that mailbox's password. This is recorded here; Gate 0 does not reopen it.
- **No redeploy is needed now.** Nothing reads these variables until BOB-25 merges, and that merge's deploy picks them up.

**Email roles**

| Role | Value | Status |
|---|---|---|
| Security recipient and initial email-operations owner | `admin_gt@pintarselalu.com` | Frozen (D-057(b)) |
| SMTP authentication mailbox | `noreply@pintarselalu.com` | Established (Supabase SMTP); the same for the app path |
| FROM (what users see) | **Tim PINTAR <noreply@pintarselalu.com>** (staging: "Tim PINTAR (Staging)", same address, so a staging message is never mistaken for production) | **Confirmed by Yazid 29 Sep (M3)** |
| Reply-To / public contact | **info@pintarselalu.com** | **Confirmed by Yazid 29 Sep (M4)**; no separate support mailbox for the 4.0 pilot |
| Reserved for future security operations | security@pintarselalu.com (exists) | Not used in 4.0; C7's recipient stays `admin_gt@` unless decided later |

All four mailboxes exist in Namecheap cPanel (Email Accounts screen, 29 Sep, supplied by Yazid). **Operational note:** `noreply@` has a 50 MB quota. Bounces and stray replies land there, so the email-operations owner should check it periodically; it is not the Reply-To.

## 3. Manual evidence still required from Yazid

| # | Fact needed | Why | Evidence to capture | Blocks |
|---|---|---|---|---|
| M1 | Namecheap plan today and the **Stellar Business** upgrade date (D-053) | 150-tester volume: Stellar's 50/h is too low for a group activation (≈60 emails in 10 min) | **SATISFIED 29 Sep (plan today).** <br>• **Plan:** Namecheap account screenshot: `pintarselalu.com` on **Stellar** shared hosting (cPanel mail, not Private Email), ACTIVE, auto-renew ON. The date shown, 2 Nov 2026, is the renewal date, not an upgrade date. <br>• **Limit that applies today:** Stellar's published **50 outgoing emails per hour per domain**. <br>• **Upgrade trigger (Yazid, 29 Sep): readiness, not a date.** Once PINTAR has cleared its testing stage and is ready for broader real-user rollout, the domain moves to Stellar Business (10,000/h), before that rollout begins (D-053 amended). Its evidence is a Namecheap screenshot at the time. <br>• **So the testing stage, the educator pilot included, runs on Stellar's 50/h for the whole domain.** At about two emails per educator activation (code, then card), a group activation session takes about 20 educators per hour, leaving room for everything else. | broader rollout (not 2E, not the pilot) |
| M2 | Stellar Business per-mailbox limits (per hour, recipients per message) | Capacity | **SATISFIED.** Namecheap's published Stellar Business limit is **10,000 outgoing emails per hour per domain**: Yazid's screenshot of the plan, 28 Sep, recorded in D-053(a); confirmed 29 Sep. | — |
| M3 | FROM display name and address | What users see | **SATISFIED 29 Sep:** Tim PINTAR <noreply@pintarselalu.com> (subject to the 2E sending and deliverability evidence) | 2E |
| M4 | Reply-To / support address | Where replies go | **SATISFIED 29 Sep:** info@pintarselalu.com (no separate support mailbox for 4.0; security@ reserved) | 2E |
| M5 | SMTP credentials for the app path, **added by you as Vercel environment variables**. Never pasted in chat | Sending | **SATISFIED 29 Sep.** Settings confirmed from cPanel, identical to Supabase's; names fixed (§2). Yazid added the four to `pintar40-staging`, **Production only**; the password never passed through chat or the repository. Vercel screenshot (names only, values hidden): `PINTAR_SMTP_HOST`, `PINTAR_SMTP_PORT`, `PINTAR_SMTP_USER`, `PINTAR_SMTP_PASSWORD`, each marked with the lock icon (sensitive), target Production. No redeploy (none needed). Still to prove in BOB-25: a Vercel function reaches port 465 with them | 2E |
| M6 | Two real inboxes for deliverability proof (one Gmail, one Outlook) | SPF, DKIM and DMARC = PASS in reality | **HELD by design until BOB-25's first staging send** (29 Sep). Yazid then provides one controlled Gmail inbox and one controlled Outlook/Hotmail inbox. The addresses are referred to by label only and never committed. Evidence: the "Show original" / message-header screenshots. Part of BOB-25's acceptance | 2E (BOB-25 acceptance) |
| M7 | (Optional) DMARC reporting address | Visibility of spoofing and delivery | DNS change by you; the next facts run shows it | 7 |
| M8 | Supabase settings changes, done through workflows when each gate needs them (staging), and at the release (production): code length and expiry, password policy, leaked-password check, password-change safeguards, MFA enrolment off, IP forwarding (BOB-12) | Rulings and gaps above | No evidence now; each change is read back by `identity-facts.yml` after it is made | 1, 3, 8 |
