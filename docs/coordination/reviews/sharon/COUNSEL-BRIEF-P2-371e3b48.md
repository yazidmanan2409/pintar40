# Counsel brief, part 2 (first use) — Sharon's check

**Work:** `docs/completion-4.1/e-local/v4/COUNSEL-BRIEF-PART2-FIRST-USE.md` at `371e3b48` (`claude/bob-41-master-plan`). Read-only.

**Verdict: NOT YET fit to send. Three additions, all small.**
- Part 1 is untouched, and the fee re-confirmation for both parts is first.
- The pilot facts match ruling 57: 10 adults, one school and one class, no children, no certificates.
- Nothing in it is sensitive or real-person data.

## Additions

1. **Say that the AI feature is not active in the pilot.** Part 1 asks about it, so counsel must not read the pilot as using it. One line in §1: "The AI drafting feature in part 1 is not active in the pilot; no data goes to an AI provider."
2. **Name every provider that holds or carries the pilot's personal data, not only the database and the host.** Q4 asks about transfer abroad, so counsel needs the full list:
   - the database (Supabase) and the application host (Vercel);
   - **the email delivery service**, which carries sign-in and notice emails with names and addresses;
   - **the off-site backup storage** (`backup-offsite.yml`, AWS), once PR-5 is switched on.

   Each with its region, in the data map attachment.
3. **Add one question: breach notification and requests from individuals.**
   - What must be in place before the pilot to meet UU PDP's notification duty after a data breach? Who must be notified, how fast, and by whom: PINTAR or the school?
   - What response times apply to an adult's request to access, correct or delete their data? PINTAR already offers account closure and a deletion request (`minta_akun`), so counsel can say whether that process is enough.

**Optional:** in Q3, say that the backups are encrypted, and how long they are kept, if the retention proposal states it.

## Addendum · revised (24 Nov 2026, 01:25 UTC): FIT TO SEND once the two regions are filled in

- **All three additions are in:**
  - the AI feature is off in the pilot;
  - the provider table names Supabase, Vercel, Resend and AWS S3;
  - Q7 covers breaches and requests from individuals, with minors moved to Q8.
- **The optional backup point is accurate.** `backup-offsite.yml:81` encrypts to both custodians' keys (D-109(c)).
- **The regions:**
  - Vercel `sin1` matches `vercel.json`;
  - Supabase `ap-southeast-1` is not in the repository, so cite where it was read (the project settings);
  - **Resend's and S3's regions must be filled in by the owner before the brief is sent.** A brief asking about transfer abroad cannot leave its processors' locations blank.
- Nothing sensitive.

## Addendum · the provider table corrected (`0126f4db`), 24 Nov 2026, 01:45 UTC

**The table is FIT TO SEND once the mail host's processing region is filled in.**
- **Supabase** `ap-southeast-1`, confirmed by the owner from the dashboard. **Vercel** `sin1`, from `vercel.json`.
- **Mail:** the `pintarselalu.com` host over SMTPS 465, matching `configure-supabase-smtp.yml:50–54`. Resend was never a processor: the earlier "resend" in `src/` is the word "re-send".
- **One check with it:** the app's own emails (activation codes, recovery: `src/app/api/_email/kirim.ts`, nodemailer) go through `PINTAR_SMTP_HOST`, which is separate from Supabase Auth's SMTP.
  - **The owner confirms** that production's `PINTAR_SMTP_HOST` is the same `pintarselalu.com` host.
  - If it is another host, that host is a further row.
- **Backup:** GCS Jakarta is correctly stated as proposed and not created. The later workflow change, from S3-style to GCS, comes to me as its own review.
